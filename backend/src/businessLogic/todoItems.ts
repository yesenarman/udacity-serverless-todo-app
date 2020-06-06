import { v4 as uuidv4 } from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoItemsAccess } from '../dataLayer/TodoItemsAccess'
import { AttachmentsAccess } from '../dataLayer/AttachmentsAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todoItemsAccess = new TodoItemsAccess()
const attachmentsAccess = new AttachmentsAccess()

export async function getAllTodoItems(userId: string): Promise<TodoItem[]> {
  const items = await todoItemsAccess.getAllTodoItems(userId)
  for (const item of items) {
    const todoId = item.todoId
    if (todoId && (await attachmentsAccess.fileExists(todoId))) {
      item.attachmentUrl = attachmentsAccess.getDownloadUrl(todoId)
    }
  }
  return items
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

export async function updateTodoItem(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<boolean> {
  return await todoItemsAccess.updateTodoItem(userId, todoId, updateTodoRequest)
}

export async function deleteTodoItem(
  userId: string,
  todoId: string
): Promise<void> {
  await todoItemsAccess.deleteTodoItem(userId, todoId)
}

export async function getAttachmentUploadUrl(
  userId: string,
  todoId: string
): Promise<string | null> {
  const todoItem = await todoItemsAccess.findItemById(userId, todoId)
  if (!todoItem) {
    return null
  }

  return attachmentsAccess.getUploadUrl(todoId)
}
