import 'source-map-support/register'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { TodoItem } from '../../models/TodoItem'
import { getAllTodoItems } from '../../businessLogic/todoItems'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('getTodos')

const getTodosHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Caller event', event)

  const userId = getUserId(event)
  const items: TodoItem[] = await getAllTodoItems(userId)

  logger.info('Todo items fetched', { userId, count: items.length })

  return {
    statusCode: 200,
    body: JSON.stringify({ items })
  }
}

export const handler = middy(getTodosHandler).use(cors({ credenials: true }))
