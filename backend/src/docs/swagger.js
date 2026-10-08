import { healthPaths } from './health.js'
import { authPaths, authSchemas } from './auth.js'
import { userPaths, userSchemas } from './users.js'
import { taskPaths, taskSchemas } from './tasks.js'
import { habitPaths, habitSchemas } from './habits.js'
import { statsPaths, statsSchemas } from './stats.js'

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
        schemas: { ...authSchemas, ...userSchemas, ...taskSchemas, ...habitSchemas, ...statsSchemas },
    },
    tags: [
        { name: 'Health' },
        { name: 'Auth' },
        { name: 'Users' },
        { name: 'Tasks' },
        { name: 'Habits' },
        { name: 'Stats' },
    ],
    paths: { ...healthPaths, ...authPaths, ...userPaths, ...taskPaths, ...habitPaths, ...statsPaths },
}
