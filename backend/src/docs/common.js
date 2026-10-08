export const idParam = (name) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
})

export const ok = (description) => ({ description })
export const notFound = { description: 'Ressource introuvable' }
export const unauthorized = { description: 'Token manquant ou invalide' }
export const badRequest = (description = 'Données invalides') => ({ description })
export const bearer = [{ bearerAuth: [] }]

export const jsonBody = (schema) => ({
    required: true,
    content: { 'application/json': { schema } },
})

export const ref = (name) => ({ $ref: `#/components/schemas/${name}` })

// réponse avec un corps JSON : { message, <key>: <schema> }
export const okWith = (description, key, schema) => ({
    description,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: { message: { type: 'string' }, [key]: schema },
            },
        },
    },
})
