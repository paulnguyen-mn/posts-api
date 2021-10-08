require('dotenv').config();
const jsonServer = require('json-server');
const queryString = require('querystring');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const yup = require('yup');
const jwt = require('jsonwebtoken');

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

server.route('/api/login').post(async (req, res) => {
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

  // if valid, generate a JWT and return, set it expired in 1 day
  res.jsonp({ access_token: token });
});

// private apis
server.use(
  '/private',
  (req, res, next) => {
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
  },
  router
);

// Customize response
router.render = (req, res) => {
  const headers = res.getHeaders();

  // In case of header x-total-count is available
  // It means client request a list of resourses with pagination
  // Then we should include pagination in response
  // Right now, json-server just simply return a list of data without pagination data
  const totalCountHeader = headers['x-total-count'];
  console.log('headers', totalCountHeader);
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
