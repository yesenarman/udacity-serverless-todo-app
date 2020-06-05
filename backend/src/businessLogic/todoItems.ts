import { v4 as uuidv4 } from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoItemsAccess } from '../dataLayer/TodoItemsAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'

const todoItemsAccess = new TodoItemsAccess()

export async function getAllTodoItems(userId: string): Promise<TodoItem[]> {
  return todoItemsAccess.getAllUserTodoItems(userId)
}

export async function createTodoItem(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  const todoId = uuidv4()

  return await todoItemsAccess.createTodoItem({
    userId: userId,
    todoId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  })
}
