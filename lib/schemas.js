'use strict'

module.exports = {
    1: {
        title: 'restify enroute definition schema',
        type: 'object',
        properties: {
            routes: {
                type: 'object',
                patternProperties: {
                    '.*': {
                        type: 'object',
                        patternProperties: {
                            head: {
                                type: 'object',
                                patternProperties: {
                                    source: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                additionalProperties: false,
                                required: [ 'source' ]
                            },
                            get: {
                                type: 'object',
                                patternProperties: {
                                    source: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                additionalProperties: false,
                                required: [ 'source' ]
                            },
                            put: {
                                type: 'object',
                                patternProperties: {
                                    source: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                additionalProperties: false,
                                required: [ 'source' ]
                            },
                            post: {
                                type: 'object',
                                patternProperties: {
                                    source: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                additionalProperties: false,
                                required: [ 'source' ]
                            },
                            delete: {
                                type: 'object',
                                patternProperties: {
                                    source: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                additionalProperties: false,
                                required: [ 'source' ]
                            },
                            patch: {
                                type: 'object',
                                patternProperties: {
                                    source: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                additionalProperties: false,
                                required: [ 'source' ]
                            },
                            options: {
                                type: 'object',
                                patternProperties: {
                                    source: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                additionalProperties: false,
                                required: [ 'source' ]
                            }
                        },
                        additionalProperties: false,
                        minProperties: 1
                    }
                },
                additionalProperties: false,
                minProperties: 1
            },
            schemaVersion: {
                type: 'number'
            },
            hotReload: {
                type: 'boolean'
            }
        },
        additionalProperties: false,
        required: [ 'schemaVersion', 'routes' ]
    }
};
