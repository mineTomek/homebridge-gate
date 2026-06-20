import http from 'node:http';
import { Config } from '../config.js';
import { Logging } from 'homebridge';
import { Mqtt } from '../mqtt/mqtt.js';

export class WebhookServer {
  private server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;

  constructor(
    private config: Config,
    private log: Logging,
    private mqtt: Mqtt,
  ) {
    this.server = http.createServer((req, res) => {
      let body = '';

      req.on('data', chunk => {
        body += chunk;

        if (body.length > 1e6) { // ? 1MB limit
          this.log.warn('Request body too large, closing connection');

          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request Entity Too Large' }));

          req.destroy();
          return;
        }
      });

      req.on('end', () => {
        if (res.writableEnded) {
          return;
        }

        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        if (req.url !== config.otaWebhookPath) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not Found' }));
          return;
        }

        try {
          const data = JSON.parse(body);

          this.handleUpdateWebhookRequest(data);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));

          this.log.warn(`Failed to parse JSON from OTA update webhook request: ${err}`);
        }
      });

      req.on('error', err => {
        this.log.error(err.toString());

        res.writeHead(500);
        res.end();
      });
    });
  }

  public start() {
    if (!this.config.otaWebhookPath) {
      this.log.error('OTA update webhook port is not configured');
      return;
    }

    this.log.debug('Starting OTA Update Webhook server on port', this.config.httpServerPort, '...');

    this.server.listen(this.config.httpServerPort, () => {
      this.log.info(`OTA Update Webhook server is listening on port ${this.config.httpServerPort}`);
    });
  }

  private handleUpdateWebhookRequest(data: UpdateWebhookData) {
    this.log.debug('Received OTA update webhook request');

    if (data.action !== 'completed') {
      this.log.warn('Received action %s, expected completed, ignoring', data.action);
      return;
    }

    if (data.workflow_run.conclusion !== 'success') {
      this.log.warn('Received conclusion of %s, expected success, ignoring', data.workflow_run.conclusion);
      return;
    }

    this.log.debug('Received valid OTA update completion webhook, fetching artifacts...');

    fetch(data.workflow_run.artifacts_url, { method: 'GET' })
      .then(response => response.json())
      .then(result => this.handleWorkflowArtifactsResponse(result))
      .catch(error => this.log.error(error));
  }

  private handleWorkflowArtifactsResponse(data: WorkflowArtifactsData) {
    this.log.debug('Received workflow artifacts response');

    if (data.total_count !== 1) {
      this.log.warn('Received %d artifacts, expected 1, ignoring', data.total_count);
      return;
    }

    const artifact = data.artifacts[0];

    if (artifact.name !== 'firmware.bin') {
      this.log.warn('Received unexpected artifact name %s, expected firmware.bin, ignoring', artifact.name);
      return;
    }

    if (artifact.expired) {
      this.log.warn('Received an expired artifact, ignoring');
      return;
    }

    if (!artifact.digest.startsWith('sha256:')) {
      this.log.warn('Received unsupported digest format %s, expected sha256, ignoring', artifact.digest.split(':')[0]);
      return;
    }

    const sha256 = artifact.digest.split(':')[1];

    if (!/^[a-f0-9]{64}$/i.test(sha256)) {
      this.log.warn('Received invalid SHA-256 digest %s, ignoring', sha256);
      return;
    }

    this.log.debug('Received valid OTA update artifact, publishing to MQTT...');

    // TODO: Add update scheduling

    this.mqtt.publishUpdateAvailable(
      artifact.archive_download_url,
      sha256,
      artifact.size_in_bytes,
    );
  }
}

export interface UpdateWebhookData {
  action: 'completed' | 'in_progress' | 'requested';
  workflow_run: {
    artifacts_url: string;
    conclusion: 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'skipped' | 'stale' | 'success' | 'timed_out' | 'startup_failure' | null;
  }
}

export interface WorkflowArtifactsData {
  total_count: number;
  artifacts: {
    id: number;
    name: string;
    size_in_bytes: number;
    url: string;
    archive_download_url: string;
    expired: boolean;
    digest: string;
  }[];
}
