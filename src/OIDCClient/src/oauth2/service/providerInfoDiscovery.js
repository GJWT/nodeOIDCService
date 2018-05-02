const oauth2 = require('../../../nodeOIDCMsg/src/oicMsg/oauth2/init.js');
const Service = require('../../service.js').Service;
const Message = require('../../../nodeOIDCMsg/src/oicMsg/message');
const requests = require('../../../nodeOIDCMsg/src/oicMsg/oauth2/requests');
const responses = require('../../../nodeOIDCMsg/src/oicMsg/oauth2/responses');
const KeyJar = require('../../../nodeOIDCMsg/src/oicMsg/keystore/keyJar');

const OIDCONF_PATTERN = "/.well-known/openid-configuration"

/**
 * ProviderInfoDiscovery
 * @class
 * @constructor
 * @extends Service
 */
class ProviderInfoDiscovery extends Service {
  /**
   * @param {ServiceContext} serviceContext Contains information that a client needs to be able to talk to a server
   * @param {DB} stateDb DB class instance
   * @param {string} clientAuthnMethod One of the six client authentication methods : bearer_body, bearer_header, client_secret_basic, 
   * client_secret_jwt, client_secret_post, private_key_jwt 
   * @param {Object.<string, string>} conf Client configuration that contains information such as client Metadata
   */
  constructor(serviceContext, stateDb, clientAuthnMethod=null, conf=null) {
    super(serviceContext, stateDb, clientAuthnMethod, conf);
    this.msgType = Message;
    this.responseCls = responses.ASConfigurationResponse;
    this.errorMsg = responses.ErrorResponse;
    this.synchronous = true;
    this.request = 'provider_info';
    this.httpMethod = 'GET';
    //this.postParseResponse.push(this.oauthPostParseResponse);
  }

  requestInfo(method='GET', requestArgs=null, params) {
    let issuer = this.serviceContext.issuer;
    let issuerUpdated = null;
    if (issuer.endsWith('/')) {
      let splitIssuer = issuer.split('');
      let reversedIssuer = splitIssuer.reverse();
      let joinedIssuer = reversedIssuer.join('');
      issuerUpdated = joinedIssuer;
    } else {
      issuerUpdated = issuer;
    }
    return {'uri': issuer + OIDCONF_PATTERN};
  }

  updateServiceContext(resp, params){
    let issuer = this.serviceContext.issuer;
    let _pcrIssuer = null;
    if (Object.keys(resp).indexOf('issuer') !== -1){
      _pcrIssuer = resp['issuer'];
      if (resp['issuer'].endsWith('/')){
        if (issuer.endsWith('/')){
          _issuer = issuer
        }else{
          _issuer = issuer + '/';
        }
      }else{
        if (issuer.endsWith('/')){
          let splitIssuer = issuer.split('');
          let reversedIssuer = splitIssuer.reverse();
          _issuer = reversedIssuer.join('');
        }else{
          _issuer = issuer;
        }
      }
      try{
        this.serviceContext.allow['issuer_mismatch'];
      }catch(err){
        if (_issuer !== _pcrIssuer){
          //throw new JSError('provider info issuer mismatch', _pcrIssuer);
        }
      }
    }else{
      _pcrIssuer = issuer;
    }

    this.serviceContext.issuer = _pcrIssuer;
    this.serviceContext.providerInfo = resp;

    for (var i = 0; i < Object.keys(resp).length; i++){
      let key = Object.keys(resp)[i];
      let val = resp[key]
      if (key.endsWith('endpoint')){
        for (var i = 0; i < this.serviceContext.service.values().length; i++){
          if (_srv.endpointName === key){
            _srv.endpoint = val;
          }
        }
      }
    }
    let kj = null;
    try{
      kj = this.serviceContext.keyJar;
    }catch(err){
      kj = new KeyJar();
    }

    //kj.loadKeys(resp, _pcrIssuer)
    this.serviceContext.keyJar = kj;
  }
}

module.exports.ProviderInfoDiscovery = ProviderInfoDiscovery;