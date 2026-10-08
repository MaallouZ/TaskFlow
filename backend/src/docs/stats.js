import { badRequest, bearer, unauthorized } from './common.js'

export const statsSchemas = {
    ActivityDay: {
        type: 'object',
        properties: {
            date: { type: 'string', format: 'date', example: '2026-10-08' },
            tasks: { type: 'integer', description: 'Tâches terminées ce jour-là', example: 2 },
            habits: { type: 'integer', description: 'Habitudes cochées ce jour-là', example: 1 },
            total: { type: 'integer', example: 3 },
        },
    },
    Activity: {
        type: 'object',
        properties: {
            timezone: { type: 'string', example: 'Europe/Paris' },
            from: { type: 'string', format: 'date', example: '2026-10-01' },
            to: { type: 'string', format: 'date', example: '2026-10-08' },
            max: { type: 'integer', description: 'Plus grand total de la période', example: 3 },
            days: {
                type: 'array',
                description: 'Un élément par jour de la période, y compris les jours à zéro',
                items: { $ref: '#/components/schemas/ActivityDay' },
            },
        },
    },
}

export const statsPaths = {
    '/api/stats/activity': {
        get: {
            tags: ['Stats'],
            summary: 'Activité jour par jour (heatmap)',
            description: 'Compte les tâches terminées et les habitudes cochées pour chaque jour de la période.',
            security: bearer,
            parameters: [
                { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date', example: '2026-10-01' } },
                { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date', example: '2026-10-08' } },
                {
                    name: 'source',
                    in: 'query',
                    schema: { type: 'string', enum: ['all', 'tasks', 'habits'], default: 'all' },
                },
                {
                    name: 'tz',
                    in: 'query',
                    description: 'Fuseau horaire (par défaut celui du profil)',
                    schema: { type: 'string', example: 'Europe/Paris' },
                },
            ],
            responses: {
                200: {
                    description: 'Activité de la période',
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/Activity' } } },
                },
                400: badRequest('Dates absentes ou invalides, période de plus de 366 jours, source ou fuseau invalides'),
                401: unauthorized,
            },
        },
    },
}
