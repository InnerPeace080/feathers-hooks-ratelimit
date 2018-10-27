const FastRateLimit = require('fast-ratelimit').FastRateLimit;
const errors = require('@feathersjs/errors');

module.exports = function(options = {}) {
  const { threshold, ttl, namespace, userIdKey, errorMessage, errorData } = options;
  const messageLimiter = new FastRateLimit({ threshold, ttl });

  return async context => {
    let _namespace;

    if (namespace) {
      _namespace = namespace;
    } else if(context.params && context.params.user) {
      const user = context.params.user;
      if (Array.isArray(userIdKey)) {
        userIdKey.some((c)=>{
          if (user[c]) {
            _namespace = user[c];
            return true
          }
          _namespace = 'default';
          return false
        })
      }else{
        _namespace = user[userIdKey] || 'default';
      }
    } else{
      _namespace = undefined;
    }

    if (_namespace) {
      try {
        await messageLimiter.consume(_namespace);
      } catch (e) {
        throw new errors.TooManyRequests(errorMessage || 'Too many requests', errorData);
      }
    }

    return context;
  };
};
