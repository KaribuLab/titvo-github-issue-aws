import { NestFactory } from '@nestjs/core'
import {
  Context,
  Handler,
  SQSEvent,
  SQSRecord
} from 'aws-lambda'
import { AppModule } from '@lambda/app.module'
import { INestApplicationContext, Logger as NestLogger } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { GithubIssueService } from '@lambda/github-issue/github-issue.service'
import { ReportStatus } from '@lambda/github-issue/github-issue.dto'
import { Annotation } from '@lambda/github-issue/github-issue.dto'

const logger = new NestLogger('github-issueLambdaHandler')

async function initApp(): Promise<INestApplicationContext> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  await app.init()
  app.flushLogs()

  return app
}

let app: INestApplicationContext | undefined;

if (app === undefined) {
  app = await initApp();
}

const service = app.get(GithubIssueService)

interface GithubIssueEvent {
  detail: {
    task_id: string
    data: {
      repo_owner: string
      repo_name: string
      commit_hash: string
      asignee: string
      status: ReportStatus
      annotations: Annotation[]
    }
  }
}

export const handler: Handler<SQSEvent> = async (
  event: SQSEvent,
  _context: Context
): Promise<void> => {
  if (event && event.Records && Array.isArray(event.Records)) {
    try {
      logger.log(`Iniciando github-issue LambdaHandler: ${JSON.stringify(event)}`)

      const records: GithubIssueEvent[] = event.Records.map(
        (record: SQSRecord) => JSON.parse(record.body) as GithubIssueEvent
      )

      const promises = records.map(async (record) => {
        logger.debug(`Procesando mensaje: ${JSON.stringify(record)}`)
        return service.process({
          taskId: record.detail.task_id,
          data: {
            repoOwner: record.detail.data.repo_owner,
            repoName: record.detail.data.repo_name,
            status: record.detail.data.status,
            annotations: record.detail.data.annotations,
            commitHash: record.detail.data.commit_hash,
            asignee: record.detail.data.asignee
          },
        })
      })

      await Promise.all(promises)

      logger.log('github-issue LambdaHandler finalizado.')
    } catch (e) {
      logger.error('Error al procesar el servicio')
      logger.error(e)
      throw e
    }
  }
}
