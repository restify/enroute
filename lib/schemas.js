'use strict'

module.exports = {
    1: {
        $schema: 'http://json-schema.org/draft-04/schema',
        title: 'restify enroute definition schema',
        type: 'object',
        patternProperties: {
            '.*': {
                type: 'object',
                patternProperties: {
                    head: {
                        type: 'object',
                        patternProperties: {
                            'source': {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    },
                    get: {
                        type: 'object',
                        patternProperties: {
                            'source': {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    },
                    put: {
                        type: 'object',
                        patternProperties: {
                            'source': {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    },
                    post: {
                        type: 'object',
                        patternProperties: {
                            'source': {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    },
                    delete: {
                        type: 'object',
                        patternProperties: {
                            'source': {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    },
                    patch: {
                        type: 'object',
                        patternProperties: {
                            'source': {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    },
                    options: {
                        type: 'object',
                        patternProperties: {
                            'source': {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    }
                },
                additionalProperties: false
            }
        },
        additionalProperties: false
    }
}
