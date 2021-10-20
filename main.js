require('dotenv').config();
const jsonServer = require('json-server');
const queryString = require('query-string');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults({
  static: './public',
});
const yup = require('yup');
const jwt = require('jsonwebtoken');
const uniqid = require('uniqid');
const multer = require('multer');
const fs = require('fs');
const casual = require('casual');

// Setup upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = './public/posts';
    fs.mkdirSync(path, { recursive: true });
    cb(null, path);
  },
  filename: function (req, file, cb) {
    const [fileName, fileExtension] = file.originalname.split('.');
    cb(null, uniqid(`${fileName}-`, `.${fileExtension}`));
  },
});

const upload = multer({ storage });

const port = process.env.PORT || 3000;
const PRIVATE_KEY = 'ae9468ec-c1fe-4cce-9772-cd899a2b496a';
const SECONDS_PER_DAY = 60 * 60 * 24;

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  const now = Date.now();
  switch (req.method) {
    case 'POST': {
      req.body.createdAt = now;
      req.body.updatedAt = now;
    }
    case 'PATCH': {
      req.body.updatedAt = now;
    }
  }
  // Continue to JSON Server router
  next();
});

function handleAddPost(req, res, next) {
  const now = Date.now();

  if (req.file?.filename) {
    req.body.imageUrl = `${process.env.STATIC_URL}/posts/${req.file?.filename}`;
  }

  req.body.createdAt = now;
  req.body.updatedAt = now;
  next();
}

function handleUpdatePost(req, res, next) {
  const now = Date.now();

  if (req.file?.filename) {
    req.body.imageUrl = `${process.env.STATIC_URL}/posts/${req.file?.filename}`;
  }

  req.body.updatedAt = now;
  next();
}

function validateFormData(req, res, next) {
  const contentType = req.headers['content-type'];
  if (!contentType.includes('multipart/form-data')) {
    return res
      .status(400)
      .json({ error: 'Invalid Content-Type, only multipart/form-data is supported.' });
  }

  next();
}

function handleUploadFile(req, res, next) {
  if (!['PATCH', 'POST'].includes(req.method)) {
    return res.status(404).json({ error: 'Not Found' });
  }

  if (req.method === 'PATCH') return handleUpdatePost(req, res, next);

  return handleAddPost(req, res, next);
}

server.use(
  '/api/with-thumbnail',
  validateFormData,
  upload.single('image'),
  handleUploadFile,
  router
);

server.post('/api/login', async (req, res) => {
  const loginSchema = yup.object().shape({
    username: yup
      .string()
      .required('Missing username')
      .min(4, 'username should have at least 4 characters'),

    password: yup
      .string()
      .required('Missing password')
      .min(6, 'password should have at least 6 characters'),
  });

  try {
    await loginSchema.validate(req.body);
  } catch (error) {
    res.status(400).jsonp({ error: error.errors?.[0] || 'Invalid username or password' });
  }

  // validate username and password
  const { username, password } = req.body;
  const token = jwt.sign({ sub: username }, PRIVATE_KEY, { expiresIn: SECONDS_PER_DAY });
  const expiredAt = new Date(Date.now() + SECONDS_PER_DAY * 1000).getTime();

  // if valid, generate a JWT and return, set it expired in 1 day
  res.jsonp({ accessToken: token, expiredAt });
});

function protectedRoute(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'You need to login to access' });

    const [tokenType, accessToken] = authHeader.split(' ');
    if (tokenType !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid token type. Only "Bearer" supported' });
    }

    jwt.verify(accessToken, PRIVATE_KEY);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Access token is not valid or expired.' });
  }
}

server.get('/api/profile', protectedRoute, (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const [tokenType, accessToken] = authHeader.split(' ');
    const payload = jwt.decode(accessToken);

    return res.status(200).json({
      username: payload.sub,
      city: casual.city,
      email: casual.email.toLowerCase(),
    });
  } catch (error) {
    console.log('failed to parse token', error);
    return res.status(400).json({ message: 'Failed to parse token.' });
  }
});

// private apis
server.use('/api/private', protectedRoute, router);

// Customize response
router.render = (req, res) => {
  const headers = res.getHeaders();

  // In case of header x-total-count is available
  // It means client request a list of resourses with pagination
  // Then we should include pagination in response
  // Right now, json-server just simply return a list of data without pagination data
  const totalCountHeader = headers['x-total-count'];
  if (req.method === 'GET' && totalCountHeader) {
    // Retrieve request pagination
    const queryParams = queryString.parse(req._parsedUrl.query);

    const result = {
      data: res.locals.data,
      pagination: {
        _page: Number.parseInt(queryParams._page) || 1,
        _limit: Number.parseInt(queryParams._limit) || 10,
        _totalRows: Number.parseInt(totalCountHeader),
      },
    };

    return res.jsonp(result);
  }

  res.jsonp(res.locals.data);
};

// Use default router
server.use('/api', router);
server.listen(port, () => {
  console.log('JSON Server is running at port', port);
});
