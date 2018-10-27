const FastRateLimit = require('fast-ratelimit').FastRateLimit;
const errors = require('@feathersjs/errors');
const ip = require('ip');

module.exports = function(options = {}) {
  const { threshold, ttl, namespace, userIdKey, errorMessage, errorData } = options;
  const messageLimiter = new FastRateLimit({ threshold, ttl });

  return async context => {
    let _namespace;

    if (namespace) {
      if (namespace === 'ip') {
        if (context.params.provider === 'socketio') {
          _namespace = context.params.ip.replace('::ffff:','')
        }else{
          if (context.params.headers && context.params.headers['x-forwarded-for']) {
            _namespace = context.params.headers['x-forwarded-for']
          }else{
            _namespace = undefined;
          }
        }
      }else{
        _namespace = namespace;
      }
    } else if(context.params && context.params.user) {
      const user = context.params.user;
      if (user.roles && (user.roles.includes('admin') || user.roles.includes('manager')) ) {
        _namespace = undefined;
      }else{
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
