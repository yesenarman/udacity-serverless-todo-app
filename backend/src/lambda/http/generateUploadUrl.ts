import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getAttachmentUploadUrl } from '../../businessLogic/todoItems'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('generateUploadUrl')

export const generateUploadUrlHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Caller event', event)

  const userId = getUserId(event)
  const todoId = event.pathParameters?.todoId

  if (!todoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid todoId parameter' })
    }
  }

  const uploadUrl = await getAttachmentUploadUrl(userId, todoId)
  if (!uploadUrl) {
    logger.info('Todo item does not exist', { userId, todoId })
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  logger.info('Attachment upload url generated', { userId, todoId, uploadUrl })

  return {
    statusCode: 200,
    body: JSON.stringify({ uploadUrl })
  }
}

export const handler = middy(generateUploadUrlHandler).use(
  cors({
    credenials: true
  })
)
