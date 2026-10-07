import { healthPaths } from './health.js'
import { authPaths, authSchemas } from './auth.js'
import { userPaths, userSchemas } from './users.js'
import { taskPaths, taskSchemas } from './tasks.js'
import { habitPaths, habitSchemas } from './habits.js'

export const swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'TaskFlow API',
        version: '1.0.0',
    },
    servers: [{ url: '/' }],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
    },
    tags: [
        { name: 'Health' },
    ],
    paths: { ...healthPaths },
}
