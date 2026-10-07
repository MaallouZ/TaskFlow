export const idParam = (name) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
})

export const ok = (description) => ({ description })
export const notFound = { description: 'Ressource introuvable' }
export const unauthorized = { description: 'Token manquant ou invalide' }
export const bearer = [{ bearerAuth: [] }]

export const jsonBody = (schema) => ({
    required: true,
    content: { 'application/json': { schema } },
})

export const ref = (name) => ({ $ref: `#/components/schemas/${name}` })
