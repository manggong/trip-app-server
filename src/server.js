require("dotenv").config();

const express = require("express");
const { join } = require("path");

const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const flash = require("express-flash");
const helmet = require("helmet");
const morgan = require("morgan");
const KakaoStrategy = require("passport-kakao").Strategy;
const passport = require("passport");
const passportConfig = require("./passport");
const session = require("express-session");
const sequelize = require("../models").sequelize;
const rp = require("request-promise");

const customerRouter = require("../src/routers/customerRouter");
const kakaoRouter = require("../src/routers/kakaoRouter");
const likesRouter = require("../src/routers/likesRouter");
const orderRouter = require("../src/routers/orderRouter");
const productRouter = require("../src/routers/productRouter");
const reviewRouter = require("../src/routers/reviewRouter");

const app = express();

sequelize.sync();
passportConfig(passport);

const corsOptions = {
  origin: true,
  credentials: true,
};

//middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.static(join(__dirname, "static")));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// router
app.use(process.env.CUSTOMER, customerRouter);
app.use(process.env.PRODUCT, productRouter);
app.use(process.env.LIKES, likesRouter);
app.use(process.env.ORDER, orderRouter);
app.use(process.env.REVIEW, reviewRouter);
app.use(process.env.KAKAO, kakaoRouter);

let temp;
let temp2;
passport.use(
  new KakaoStrategy(
    {
      clientID: "d5ea377b7ceaefa85460d56a16f36df7",
      callbackURL: "http://70.12.227.32:8181/kakao/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      temp = profile._json.id;
      console.log(temp);
      temp2 = accessToken;
      process.nextTick(() => {
        return done(null, profile);
      });
    }
  )
);

app.get("/kakao2", (request, response) => {
  console.log("kakakakakakaka");
  console.log(request.session);
});

app.get("/kakao", passport.authenticate("kakao", { prompt: "select_account" }));

app.get(
  "/kakao/callback",
  passport.authenticate("kakao", {
    successRedirect: "http://70.12.227.32:8181/",
    failureRedirect: "http://www.naver.com",
  })
);

app.get("/kakao/logout", (request, response) => {
  console.log(temp);
  const options = {
    method: "POST",
    uri: "https://kapi.kakao.com/v1/user/logout",
    form: `target_id_type=user_id&target_id=${temp}`,
    headers: {
      Authorization: `KakaoAK bf8adb8c56ebe89007f9cd6bc97c9f90`,
    },
  };

  console.log(temp2);
  rp(options)
    .then((body) => {
      console.log(body);
      //response.send(body);
      console.log(request.isAuthenticated());
      request.logout();
      const options2 = {
        method: "POST",
        uri: "https://kapi.kakao.com/v1/user/unlink",
        headers: {
          Authorization: `Bearer ${temp2}`,
        },
      };

      rp(options2)
        .then((body) => {
          console.log(body);
          //response.send(body);
          console.log(request.isAuthenticated());
          request.logout();
        })
        .catch((err) => {
          console.log(err);
          //response.redirect("http://www.naver.com");
        });
    })
    .catch((err) => {
      console.log(err);
      response.redirect("http://www.naver.com");
    });

  response.redirect("http://www.daum.net");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "http://localhost:3000/user/signup",
  }),
  (req, res) => {
    res.redirect("http://localhost:3000/");
  }
);

const startServer = () => {
  console.log(`server listening ${process.env.PORT}`);
};
app.listen(process.env.PORT, startServer);

app.get("/session", (req, res) => {
  res.send(req.session);
});

app.post("/test", (req, res) => {
  console.log(req.body);
  console.log(req.body.name);
  console.log(req.body.city);
  console.log(JSON.stringify(req.body));
  console.log(JSON.parse(req.body));
});
