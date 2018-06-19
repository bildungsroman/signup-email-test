import rp from 'request-promise';
import uri from 'url';
import AWS from 'aws-sdk';
// const creds = new AWS.Credentials(process.env.SES_ACCESS_KEY, process.env.SES_SECRET);
// not needed if just adding to a table!
// AWS.config.credentials = creds;

module.exports = function handler (request, context, callback) {
  console.log(request.body);
  // Log the request to the console.
  console.log('Request:');
  console.dir(request);

  // parse form data into json
  // const fields = request.body.split('&');
  // const data = {};
  // for (let i = 0; i < fields.length; i++) {
  //   const [key, value] = fields[i].split('=');
  //   data[key] = decodeURIComponent(value.replace(/\+/g, ' '));
  // }

  // simpler parsing for just email
  const data = request.body.email;

  console.dir(data);

  console.dir(request.headers);
  const referer = request.headers.Referer || request.headers.referer;
  const retUri = uri.parse(referer);

  const response = {
    statusCode: '302',
    headers: {
      'Location': `${retUri.protocol}//${retUri.host}${data.pdf}`
    },
    body: 'You are being redirected'
  };
  console.dir(response.headers);

  const params = {
    Destination: { /* required */
      ToAddresses: [
        'sam@stackery.io',
        'leads@stackery.io'
        /* more items */
      ]
    },
    Message: { /* required */
      Body: { /* required */
        Text: {
          Charset: 'UTF-8',
          Data: emailBody(data, request)
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: `New signup email address: ${data}`
      }
    },
    Source: 'ServerlessDays Portland <http://portland.serverlessdays.io>'
  };
  new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise().then(() => {
    var options = {
      method: 'POST',
      uri: 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8',
      resolveWithFullResponse: true
    };
    return rp(options).form(dataToSFDC(data))
      .then(function (parsedBody) {
        console.log(parsedBody);
        // POST succeeded...
      })
      .catch(function (err) {
        console.log(err);
        // POST failed...
      });
  }).then(() => callback(null, response))
    .catch(err => { console.log(err); callback(err); });
};
function dataToSFDC (data) {
  return {
    // first_name: data['first-name'],
    // last_name: data['last-name'],
    // company: data['company-name'],
    // description: data['message'],
    email: data,
    // phone: data['phone'],
    // title: data['title'],
    // call_me: data['volunteer'],
    // oid: '00D6A000002zfHq',
    retURL: 'https://portland.serverlessdays.io',
    lead_source: 'Webform'
  };
}

function emailBody (data, request) {
  return `
  Email: ${data}
  Source IP: ${request.requestContext.identity.sourceIp}
  User Agent: ${request.requestContext.identity.userAgent}
  `;
}
