import { ok } from './common.js'

export const healthPaths = {
    '/api/health': {
        get: { tags: ['Health'], summary: "État de l'API", responses: { 200: ok('API disponible') } },
    },
}
