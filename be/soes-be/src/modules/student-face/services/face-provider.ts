import {
  CreateFaceLivenessSessionCommand,
  DeleteFacesCommand,
  DetectFacesCommand,
  GetFaceLivenessSessionResultsCommand,
  IndexFacesCommand,
  RekognitionClient,
  SearchFacesByImageCommand,
} from '@aws-sdk/client-rekognition'
import { faceVerificationConfig } from '../../../config'

const client = new RekognitionClient({ region: faceVerificationConfig.region })

export async function createLivenessSession(purpose: 'ENROLLMENT' | 'EXAM_ENTRY') {
  if (faceVerificationConfig.provider === 'mock') return `mock-${crypto.randomUUID()}`
  const challenge = purpose === 'ENROLLMENT' ? faceVerificationConfig.enrollmentChallenge : faceVerificationConfig.examChallenge
  const result = await client.send(new CreateFaceLivenessSessionCommand({
    Settings: { AuditImagesLimit: purpose === 'ENROLLMENT' ? 4 : 1, ChallengePreferences: [{ Type: challenge }] },
  }))
  if (!result.SessionId) throw new Error('Face liveness session was not created')
  return result.SessionId
}

export async function getLivenessResult(sessionId: string) {
  if (faceVerificationConfig.provider === 'mock') {
    if (!sessionId.startsWith('mock-')) throw new Error('Invalid mock face session')
    return { status: 'SUCCEEDED' as const, confidence: 100, image: new Uint8Array([1]), reviewImage: new Uint8Array([1]), auditImages: [] as Uint8Array[], feedbackCodes: [] as string[] }
  }
  const result = await client.send(new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId }))
  return {
    status: result.Status,
    confidence: result.Confidence ?? 0,
    image: result.ReferenceImage?.Bytes,
    reviewImage: result.AuditImages?.[0]?.Bytes ?? result.ReferenceImage?.Bytes,
    auditImages: result.AuditImages?.flatMap((item) => item.Bytes ? [item.Bytes] : []) ?? [],
    feedbackCodes: result.Feedback?.flatMap((item) => item.Code ? [item.Code] : []) ?? [],
  }
}

export async function inspectFaceVisibility(reference: Uint8Array, auditImages: Uint8Array[]) {
  if (faceVerificationConfig.provider === 'mock') return {
    reference: [{ FaceOccluded: { Value: false, Confidence: 100 } }], audit: [],
  }
  const detect = async (image: Uint8Array) => {
    const result = await client.send(new DetectFacesCommand({ Image: { Bytes: image }, Attributes: ['FACE_OCCLUDED'] }))
    return result.FaceDetails ?? []
  }
  const referenceFaces = await detect(reference)
  const auditFaces = []
  for (const image of auditImages) auditFaces.push(await detect(image))
  return { reference: referenceFaces, audit: auditFaces }
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

export async function deleteStudentFace(faceId: string, collectionId = faceVerificationConfig.collectionId) {
  if (faceVerificationConfig.provider === 'mock') return
  const result = await client.send(new DeleteFacesCommand({
    CollectionId: collectionId,
    FaceIds: [faceId],
  }))
  if (result.UnsuccessfulFaceDeletions?.length) throw new Error('AWS could not delete the enrolled face')
}
