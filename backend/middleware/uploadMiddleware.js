const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist
const createFolderIfNotExist = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

const uploadDir = path.join(__dirname, '../uploads');
const profilesDir = path.join(uploadDir, 'profiles');
const resumesDir = path.join(uploadDir, 'resumes');
const documentsDir = path.join(uploadDir, 'documents');

createFolderIfNotExist(profilesDir);
createFolderIfNotExist(resumesDir);
createFolderIfNotExist(documentsDir);

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
      cb(null, 'uploads/profiles/');
    } else if (file.fieldname === 'resume') {
      cb(null, 'uploads/resumes/');
    } else {
      cb(null, 'uploads/documents/');
    }
  },
  filename: (req, file, cb) => {
    // Make filename unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter based on type
const fileFilter = (req, file, cb) => {
  const filetypes = {
    profileImage: /jpeg|jpg|png|webp/,
    resume: /pdf|doc|docx/,
    documents: /jpeg|jpg|png|pdf|doc|docx|zip/
  };

  const extname = filetypes[file.fieldname].test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes[file.fieldname].test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error(`Error: Invalid file type for field ${file.fieldname}!`));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Handle fields
const uploadEmployeeFiles = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]);

module.exports = { uploadEmployeeFiles };
