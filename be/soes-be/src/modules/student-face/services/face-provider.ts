import {
  CreateFaceLivenessSessionCommand,
  DeleteFacesCommand,
  GetFaceLivenessSessionResultsCommand,
  IndexFacesCommand,
  RekognitionClient,
  SearchFacesByImageCommand,
} from '@aws-sdk/client-rekognition'
import { faceVerificationConfig } from '../../../config'

const client = new RekognitionClient({ region: faceVerificationConfig.region })

export async function createLivenessSession() {
  if (faceVerificationConfig.provider === 'mock') return `mock-${crypto.randomUUID()}`
  const result = await client.send(new CreateFaceLivenessSessionCommand({}))
  if (!result.SessionId) throw new Error('Face liveness session was not created')
  return result.SessionId
}

export async function getLivenessResult(sessionId: string) {
  if (faceVerificationConfig.provider === 'mock') {
    if (!sessionId.startsWith('mock-')) throw new Error('Invalid mock face session')
    return { status: 'SUCCEEDED' as const, confidence: 100, image: new Uint8Array([1]) }
  }
  const result = await client.send(new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId }))
  return { status: result.Status, confidence: result.Confidence ?? 0, image: result.ReferenceImage?.Bytes }
}

export async function indexStudentFace(studentId: string, image: Uint8Array) {
  if (faceVerificationConfig.provider === 'mock') return `mock-face-${crypto.randomUUID()}`
  const result = await client.send(new IndexFacesCommand({
    CollectionId: faceVerificationConfig.collectionId,
    ExternalImageId: studentId,
    Image: { Bytes: image },
    MaxFaces: 1,
    QualityFilter: 'AUTO',
  }))
  const faceId = result.FaceRecords?.[0]?.Face?.FaceId
  if (!faceId) throw new Error('No usable face was detected')
  return faceId
}

export async function matchStudentFace(studentId: string, image: Uint8Array) {
  if (faceVerificationConfig.provider === 'mock') return 100
  const result = await client.send(new SearchFacesByImageCommand({
    CollectionId: faceVerificationConfig.collectionId,
    Image: { Bytes: image },
    FaceMatchThreshold: faceVerificationConfig.similarityThreshold,
    MaxFaces: 10,
  }))
  return result.FaceMatches?.find((match) => match.Face?.ExternalImageId === studentId)?.Similarity ?? 0
}

export async function deleteStudentFace(faceId: string) {
  if (faceVerificationConfig.provider === 'mock') return
  await client.send(new DeleteFacesCommand({
    CollectionId: faceVerificationConfig.collectionId,
    FaceIds: [faceId],
  }))
}
