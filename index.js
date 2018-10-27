const FastRateLimit = require('fast-ratelimit').FastRateLimit;
const errors = require('@feathersjs/errors');

module.exports = function(options = {}) {
  const { threshold, ttl, namespace, userIdKey, userIdKey2, errorMessage, errorData } = options;
  const messageLimiter = new FastRateLimit({ threshold, ttl });

  return async context => {
    let _namespace;

    if (namespace) {
      _namespace = namespace;
    } else if(context.params && context.params.user) {
      const user = context.params.user;
      _namespace = user[userIdKey] || user[userIdKey2] || 'default';
    } else{
      _namespace = 'default';
    }

    try {
      await messageLimiter.consume(_namespace);
    } catch (e) {
      throw new errors.TooManyRequests(errorMessage || 'Too many requests', errorData);
    }

    return context;
  };
};
