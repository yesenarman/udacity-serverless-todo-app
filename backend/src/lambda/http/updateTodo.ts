import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateTodoItem } from '../../businessLogic/todoItems'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('updateTodo')

const updateTodoHandler: APIGatewayProxyHandler = async function (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logger.info('Caller event', event)

  const userId = getUserId(event)
  const todoId = event.pathParameters?.todoId
  const updateTodoRequest = JSON.parse(event.body || '') as UpdateTodoRequest

  if (!todoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid todoId parameter' })
    }
  }

  const updated = await updateTodoItem(userId, todoId, updateTodoRequest)
  if (!updated) {
    logger.info('Todo item does not exist', { userId, todoId })
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Todo item does not exist'
      })
    }
  }

  logger.info('Todo item was updated', { userId, todoId })

  return {
    statusCode: 200,
    body: ''
  }
}

export const handler = middy(updateTodoHandler).use(cors({ credenials: true }))
