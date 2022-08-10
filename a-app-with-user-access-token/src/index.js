import { create } from './server.js';

const port = process.env.WEB_PORT || 8080;

create()
.then(app => {
    app.listen(port, () => {
        console.log(`Server has started on port ${port}!`);
    }); 
}).catch(err => console.log(err));