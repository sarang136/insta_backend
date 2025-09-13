

const multer = require('multer');

const MulterFunction = () => {
    const storage = multer.memoryStorage();
    const upload = multer({storage})
}