'use strict';
// Preserve Google's full response. Never record request headers or bodies.
function redact(text, secrets=[]) {
    let out=String(text ?? '');
    for(const secret of secrets)if(secret)out=out.split(String(secret)).join('[REDACTED]');
    return out.replace(/(Bearer\s+)[^\s"'<>]+/gi,'$1[REDACTED]')
        .replace(/("(?:access_token|refresh_token|id_token|client_secret|apiKey|api_key)"\s*:\s*")[^"]*/gi,'$1[REDACTED]');
}
async function googleHttpError(response,{url,method='GET',operation='',secrets=[]}={}) {
    let body;
    try{body=await response.text();}catch(error){body='[Response could not be read: '+String(error.message||error)+']';}
    // Omit query strings: they may contain credentials. The response is not truncated.
    let endpoint='';try{const u=new URL(url);endpoint=u.origin+u.pathname;}catch(_){}
    const details={httpStatus:response.status,method,endpoint,operation,responseText:redact(body,secrets)};
    const code='GOOGLE_HTTP_'+response.status;
    return Object.assign(new Error(code+'\n'+details.responseText),{code,google:details});
}
module.exports={googleHttpError,redact};
