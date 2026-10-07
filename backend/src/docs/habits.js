import { idParam, jsonBody, notFound, ok, ref } from './common.js'

export const habitSchemas = {
    Habit: {
        type: 'object',
        properties: {
            name: { type: 'string', maxLength: 100, example: 'Sport' },
            description: { type: 'string', maxLength: 500 },
            frequency: { type: 'string', enum: ['daily', 'weekly'], example: 'daily' },
            targetPerPeriod: { type: 'integer', minimum: 1, maximum: 31, example: 1 },
            completedDates: { type: 'array', items: { type: 'string' }, example: ['2026-10-07'] },
        },
    },
}

export const habitPaths = {
    '/api/habits': {
        get: { tags: ['Habits'], summary: 'Lister ses habitudes', responses: { 200: ok('Liste des habitudes') } },
        post: {
            tags: ['Habits'],
            summary: 'Créer une habitude',
            requestBody: jsonBody(ref('Habit')),
            responses: { 201: ok('Habitude créée') },
        },
    },
    '/api/habits/{habitId}': {
        parameters: [idParam('habitId')],
        get: { tags: ['Habits'], summary: "Détail d'une habitude", responses: { 200: ok('Habitude'), 404: notFound } },
        patch: {
            tags: ['Habits'],
            summary: 'Modifier une habitude',
            requestBody: jsonBody(ref('Habit')),
            responses: { 200: ok('Habitude modifiée'), 404: notFound },
        },
        delete: { tags: ['Habits'], summary: 'Supprimer une habitude', responses: { 200: ok('Habitude supprimée'), 404: notFound } },
    },
}
