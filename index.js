const FastRateLimit = require('fast-ratelimit').FastRateLimit;
const errors = require('@feathersjs/errors');
const ip = require('ip');

module.exports = function(options = {}) {
  const { threshold, ttl, namespace, entity, userIdKey, errorMessage, errorData } = options;
  const messageLimiter = new FastRateLimit({ threshold, ttl });

  return async (context) => {
    let _namespace;

    if (entity && userIdKey && context.params && context.params[entity]) {
      const user = context.params[entity];
      if (user.roles && (user.roles.includes('admin') || user.roles.includes('manager')) ) {
        _namespace = undefined;
      }else{
        if (Array.isArray(userIdKey)) {
          userIdKey.some((c)=>{
            if (user[c]) {
              _namespace = user[c];

              return true;
            }
            _namespace = 'default';

            return false;
          });
        }else{
          _namespace = user[userIdKey] || 'default';
        }
      }
    }else{
      _namespace = undefined;
    }

    if (namespace) {
      var addNamespace;
      if (namespace === 'ip') {
        if (context.params.provider === 'socketio') {
          addNamespace = context.params.ip.replace('::ffff:', '');
        }else{
          if (context.params.headers && context.params.headers['x-forwarded-for']) {
            addNamespace = context.params.headers['x-forwarded-for'];
          }else{
            addNamespace = undefined;
          }
        }
      }else{
        addNamespace = namespace;
      }
      if (addNamespace) {
        if (_namespace) {
          _namespace = `${_namespace}-${addNamespace}`;
        }else{
          _namespace=addNamespace;
        }
      }
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
