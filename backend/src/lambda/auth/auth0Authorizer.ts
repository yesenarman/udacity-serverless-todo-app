import 'source-map-support/register'
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import Axios from 'axios'
import { verify, decode } from 'jsonwebtoken'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import { createLogger } from '../../utils/logger'

const logger = createLogger('auth')

const jwksUrl = process.env.JWKS_URL || ''
let signingKeys: { kid: string; publicKey: string }[]

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken || '')
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const secret: string = await getSecret(jwt.header.kid || '')
  verify(token, secret, { algorithms: ['RS256'] })
  return jwt.payload
}

async function getSecret(kid: string): Promise<string> {
  const signingKey = (await getSigningKeys()).find((key) => key.kid === kid)
  if (!signingKey) {
    throw new Error('Signing key not found')
  }
  return signingKey.publicKey
}

async function getSigningKeys() {
  if (!signingKeys) {
    const keys = await Axios.get(jwksUrl).then((res) => res.data.keys || [])

    signingKeys = keys
      .filter(
        (key: any) =>
          key.use === 'sig' && // JWK property `use` determines the JWK is for signing
          key.kty === 'RSA' && // We are only supporting RSA (RS256)
          key.kid && // The `kid` must be present to be useful for later
          ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
      )
      .map((key: any) => {
        return { kid: key.kid, publicKey: certToPEM(key.x5c[0]) }
      })
  }

  return signingKeys
}

function certToPEM(cert: string) {
  const match = cert.match(/.{1,64}/g)
  if (match) {
    cert = match.join('\n')
    cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
  }
  return cert
}

function getToken(authHeader: string): string {
  if (!authHeader) {
    throw new Error('No authentication header')
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authentication header')
  }

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
