const fs = require('fs');
const path = require('path');
const fetch = global.fetch;
const baseUrl = 'http://localhost:8080';

async function main() {
  try {
    const uniqueSuffix = Date.now();
    const userEmail = `e2e-login+${uniqueSuffix}@example.com`;
    const candidateEmail = `alice+${uniqueSuffix}@example.com`;

    console.log('1) Register new user');
    const registerResp = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: 'Password123!',
        firstName: 'E2E',
        lastName: 'Tester'
      })
    });
    console.log('register status', registerResp.status);
    const registerData = await registerResp.text();
    console.log(registerData);

    console.log('2) Login user');
    const loginResp = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: 'Password123!'
      })
    });
    console.log('login status', loginResp.status);
    const loginData = await loginResp.json();
    console.log(loginData);

    if (!loginData?.accessToken) {
      console.error('Login did not return accessToken');
      process.exit(1);
    }

    console.log('3) Create candidate');
    const candidateResp = await fetch(`${baseUrl}/api/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.accessToken}` },
      body: JSON.stringify({
        firstName: 'Alice',
        lastName: 'Candidate',
        email: candidateEmail,
        phone: '+1234567890'
      })
    });
    console.log('candidate create status', candidateResp.status);
    const candidateData = await candidateResp.json();
    console.log(candidateData);
    const candidateId = candidateData?.id;
    if (!candidateId) {
      console.error('Candidate creation failed');
      process.exit(1);
    }

    console.log('4) Upload resume file');
    const resumePath = path.join(__dirname, 'tmp_resume.pdf');
    const pdfBytes = Buffer.from(
      'JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEgL0tpZHNbIDMgMCBSIF0+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94IFswIDAgNjEyIDc5Ml0vQ29udGVudHMgNCAwIFIvUmVzb3VyY2VzIDw8L0ZvbnQgPDwgL0YxIDUgMCBSID4+Pj4+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGYKKExpbWUgZm9yIGVhc2llciB0ZXN0aW5nLgpUKgplbmRzdHJlYW0KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDYzPj4Kc3RyZWFtCkJUCg9GCi9GMSAyNCBUZgowMCA3MDAgVGYKKEhlbGxvIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDAwMDAwIG4K000wMDAwMDAwMDAgMDAwMDAgbgowMDAwMDAwMDEwIDAwMDAwIG4KMDAwMDAwMDA2MSAwMDAwMCBuCjAwMDAwMDAxMjAgMDAwMDAgbgowMDAwMDAwMDIyMSAwMDAwMCBuCjAwMDAwMDAzMDUgMDAwMDAgbgowMDAwMDAwMDAwIDAwMDAwIG4Kc3RyZWFtCjw8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgozNzYKJSVFT0YK',
      'base64'
    );
    fs.writeFileSync(resumePath, pdfBytes);

    const boundary = '----WebKitFormBoundary' + Date.now();
    const filename = 'resume.pdf';
    const fileBuffer = fs.readFileSync(resumePath);
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
      Buffer.from('Content-Type: application/pdf\r\n\r\n'),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadResp = await fetch(`${baseUrl}/api/candidates/${candidateId}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body
    });
    console.log('resume upload status', uploadResp.status);
    const uploadData = await uploadResp.json();
    console.log(uploadData);

    console.log('E2E test finished. Inspect candidate-service and cv-parser logs for document processing.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
