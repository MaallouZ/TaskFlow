import { badRequest, bearer, idParam, jsonBody, notFound, okWith, ref, unauthorized } from './common.js'

const dateParam = {
    name: 'date',
    in: 'path',
    required: true,
    description: 'Jour au format AAAA-MM-JJ',
    schema: { type: 'string', format: 'date', example: '2026-10-08' },
}

export const habitSchemas = {
    // ce qu'on envoie pour créer une habitude
    HabitInput: {
        type: 'object',
        required: ['name', 'frequency'],
        properties: {
            name: { type: 'string', maxLength: 100, example: 'Sport' },
            description: { type: 'string', maxLength: 500, example: '20 minutes' },
            frequency: { type: 'string', enum: ['daily', 'weekly'], example: 'weekly' },
            targetPerPeriod: { type: 'integer', minimum: 1, maximum: 31, example: 3 },
        },
    },
    // ce qu'on envoie pour modifier une habitude (tous les champs sont facultatifs)
    HabitUpdate: {
        type: 'object',
        properties: {
            name: { type: 'string', maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
            frequency: { type: 'string', enum: ['daily', 'weekly'] },
            targetPerPeriod: { type: 'integer', minimum: 1, maximum: 31 },
        },
    },
    // ce que renvoie l'API
    Habit: {
        type: 'object',
        properties: {
            _id: { type: 'string', example: '6ac75fc0519f2a216455c849' },
            name: { type: 'string', example: 'Sport' },
            description: { type: 'string', example: '20 minutes' },
            frequency: { type: 'string', enum: ['daily', 'weekly'], example: 'weekly' },
            targetPerPeriod: { type: 'integer', example: 3 },
            completedDates: {
                type: 'array',
                items: { type: 'string', format: 'date' },
                description: 'Jours cochés. Modifiable seulement avec les routes /completions',
                example: ['2026-10-06', '2026-10-08'],
            },
            userId: { type: 'string', description: "Id du propriétaire (ajouté par le serveur à partir du token)" },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
}

export const habitPaths = {
    '/api/habits': {
        get: {
            tags: ['Habits'],
            summary: 'Lister ses habitudes',
            security: bearer,
            responses: {
                200: okWith('Liste des habitudes', 'habits', { type: 'array', items: ref('Habit') }),
                401: unauthorized,
            },
        },
        post: {
            tags: ['Habits'],
            summary: 'Créer une habitude',
            security: bearer,
            requestBody: jsonBody(ref('HabitInput')),
            responses: {
                201: okWith('Habitude créée', 'habit', ref('Habit')),
                400: badRequest('Nom ou fréquence manquants, valeurs invalides'),
                401: unauthorized,
            },
        },
    },
    '/api/habits/{habitId}': {
        parameters: [idParam('habitId')],
        get: {
            tags: ['Habits'],
            summary: "Détail d'une habitude",
            security: bearer,
            responses: {
                200: okWith('Habitude', 'habit', ref('Habit')),
                401: unauthorized,
                404: notFound,
            },
        },
        patch: {
            tags: ['Habits'],
            summary: 'Modifier une habitude',
            security: bearer,
            requestBody: jsonBody(ref('HabitUpdate')),
            responses: {
                200: okWith('Habitude modifiée', 'habit', ref('Habit')),
                400: badRequest(),
                401: unauthorized,
                404: notFound,
            },
        },
        delete: {
            tags: ['Habits'],
            summary: 'Supprimer une habitude',
            security: bearer,
            responses: {
                200: okWith('Habitude supprimée', 'habit', ref('Habit')),
                401: unauthorized,
                404: notFound,
            },
        },
    },
    '/api/habits/{habitId}/completions/{date}': {
        parameters: [idParam('habitId'), dateParam],
        put: {
            tags: ['Habits'],
            summary: 'Cocher un jour',
            description: 'Ajoute le jour à completedDates. Cocher deux fois le même jour ne crée pas de doublon.',
            security: bearer,
            responses: {
                200: okWith('Habitude cochée', 'habit', ref('Habit')),
                400: badRequest('Date invalide, ou jour dans le futur (selon le fuseau de l’utilisateur)'),
                401: unauthorized,
                404: notFound,
            },
        },
        delete: {
            tags: ['Habits'],
            summary: 'Décocher un jour',
            description: 'Retire le jour de completedDates.',
            security: bearer,
            responses: {
                200: okWith('Habitude décochée', 'habit', ref('Habit')),
                400: badRequest('Date invalide'),
                401: unauthorized,
                404: notFound,
            },
        },
    },
}
