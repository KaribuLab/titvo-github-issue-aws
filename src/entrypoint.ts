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
import { GithubIssueInputDto, GithubIssueOutputDto } from '@lambda/github-issue/github-issue.dto'

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

export const handler: Handler<GithubIssueInputDto> = async (
  event: GithubIssueInputDto,
  _context: Context
): Promise<GithubIssueOutputDto> => {
  try {
    logger.debug(`Procesando mensaje: ${JSON.stringify(event)}`)
    return service.process(event)
  } catch (e) {
    logger.error('Error al procesar el servicio')
    logger.error(e)
    throw e
  }
}
