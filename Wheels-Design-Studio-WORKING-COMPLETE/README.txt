WHEELS DESIGN STUDIO - SHARED BUILD

STRUCTURE
- One shared CSS file: css/wheels-designers.css
- One shared JavaScript file: js/wheels-designers.js
- Separate HTML entry pages for each designer.

DOWNLOADS
- Download PNG: finished design proof only.
- Download Files (ZIP): contains the PNG proof, Production-Details.txt, and original uploaded artwork files.
- JSON is no longer included in the production ZIP.

EMAIL DESIGN FILES
The frontend email workflow is already wired in. The Email Design Files button creates the same production ZIP and POSTs it as multipart/form-data to a backend endpoint.

DEVELOPER SETUP
1. Create a same-site POST endpoint that accepts multipart/form-data.
2. The uploaded ZIP field is named: design_files
3. Additional fields sent are: product, print_method, design_summary, file_name
4. The endpoint should email design_files to the Wheels design/artwork department.
5. Return any HTTP 2xx response when the email has been accepted/sent.
6. Put the endpoint URL into each designer HTML page here:
   <meta name="wheels-design-email-endpoint" content="/your-endpoint">
   OR set window.WHEELS_DESIGN_EMAIL_ENDPOINT before wheels-designers.js loads.

UNTIL THE ENDPOINT IS CONNECTED
Email Design Files displays a message telling the customer to use Download Files (ZIP). The ZIP download works entirely in the browser.
