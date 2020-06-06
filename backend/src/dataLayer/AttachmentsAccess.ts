import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('AttachmentsAccess')

export class AttachmentsAccess {
  constructor(
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly attachmentsBucket = process.env.ATTACHMENTS_S3_BUCKET ||
      '',
    private readonly uploadUrlExpiration = parseInt(
      process.env.ATTACHMENT_UPLOAD_URL_EXPIRATION || '0'
    ),
    private readonly downloadUrlExpiration = parseInt(
      process.env.ATTACHMENT_DOWNLOAD_URL_EXPIRATION || '0'
    )
  ) {}

  async fileExists(todoId: string): Promise<boolean> {
    try {
      logger.info('Checking if file exists', {
        Bucket: this.attachmentsBucket,
        Key: todoId
      })
      const head = await this.s3
        .headObject({
          Bucket: this.attachmentsBucket,
          Key: todoId
        })
        .promise()
      logger.info('Head object result', { head })
      return true
    } catch (error) {
      logger.error('Head object error', { error })
      return false
    }
  }

  getUploadUrl(todoId: string) {
    return this.s3.getSignedUrl('putObject', {
      Bucket: this.attachmentsBucket,
      Key: todoId,
      Expires: this.uploadUrlExpiration
    })
  }

  getDownloadUrl(todoId: string) {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.attachmentsBucket,
      Key: todoId,
      Expires: this.downloadUrlExpiration
    })
  }
}
