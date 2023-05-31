const color = require("colors")
const spawnSync = require("child_process").spawnSync;
const readlineSync = require("readline-sync");
const fs = require("fs");
const os = require("os");
const yaml = require("js-yaml");
const { writeFile } = require("fs/promises");
const resolve = require("path").resolve;

const PROJECT_ROOT = resolve(__dirname, "..");
const RECORDS_DIR = `${PROJECT_ROOT}/records`;
const CONFIG_FILE = `${RECORDS_DIR}/config.yaml`;
const PYTHON_DIR = `${PROJECT_ROOT}/python`;
const PYTHON_PATH = `${PYTHON_DIR}/.venv/bin/python`
const PYTHON_MAIN = `${PYTHON_DIR}/main.py`

// main
const course = readData(CONFIG_FILE);

if (process.argv.length !== 5 && process.argv.length !== 6) {
  showUsage();
  process.exit(1);
}
// get args
const args = process.argv.slice(2);
let file, courseID, json;
if (args[0] === "show" || args[0] === "rm" || args[0] === "download") {
  file = args[1];
  courseID = args[2];
} else {
  file = args[0];
  courseID = args[1];
  json = args[2];
}

switch (true) {
  case course.hasOwnProperty(file):
    file = `${course[file]}.yaml`;
    break;
  default:
    showUsage();
    process.exit(1);
}
// processing
switch (args[0]) {
  case "show":
    show(`${RECORDS_DIR}/${file}`, courseID);
    break;
  case "rm":
    remove(`${RECORDS_DIR}/${file}`, courseID);
    break;
  case "download":
    download(file, courseID);
    break;
  default:
    if (args.length === 4) {
      add(`${RECORDS_DIR}/${file}`, courseID, json, args[3]);
    } else {
      add(`${RECORDS_DIR}/${file}`, courseID, json);
    }
    break;
}

// functions
function show(file, courseID) {
  let data = readData(file);
  if (courseID === "ls") {
    for (let key in data) {
      console.log(key);
    }
    return;
  }
  const courseClass = getCourseClass(courseID);
  if (!data.hasOwnProperty(courseClass)) {
    console.log("==> " + "Error\n".red + "\tNo data");
    process.exit(1);
  }
  console.log("--------------------------------------------------------------------------------");
  if (courseClass !== courseID) {
    // 如果指定了课程序号，则只显示该序号对应的 URL 。
    const num = parseInt(courseID.split("-")[2]);
    console.log(data[courseClass][num - 1]);
    console.log("--------------------------------------------------------------------------------");
    return;
  }
  for (let url of data[courseClass]) {
    console.log(url);
    console.log("--------------------------------------------------------------------------------");
  }
}

function remove(file, courseID) {
  let data = readData(file);
  const courseClass = getCourseClass(courseID);
  let num;
  if (courseClass !== courseID) {
    num = parseInt(courseID.split("-")[2]);
  }
  if (data.hasOwnProperty(courseClass)) {
    if (num) {
      if (num === data[courseClass].length) {
        data[courseClass].pop();
      } else {
        delete data[courseClass][num - 1];
      }
    } else {
      delete data[courseClass];
    }
    // 写入文件
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, "  "));
      console.log("==> " + "Success\n".green + "\tSuccessfully removed " + file.slice(0, file.indexOf(".")) + " " + courseID);
    } catch (e) {
      console.log("==> " + "Error\n".red + "\tFailed to write file: " + file);
      process.exit(1);
    }
  } else {
    console.log("==> " + "Error\n".red + "\tNo data");
    process.exit(1);
  }
}

function readData(file, suppressError = false) {
  let data;
  try {
    data = yaml.load(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") {  // file not found
      if (suppressError) {
        console.log("==> " + "Warning\n".yellow + "\tFile not found: " + file);
        return {};
      } else {
        console.log("==> " + "Error\n".red + "\tFile not found: " + file)
      }
    } else if (e instanceof SyntaxError) {  // YAML parse error
      console.log("==> " + "Error\n".red + "\tYAML parse error: " + file)
    } else {  // other error
      console.log("==> " + "Error\n".red + "\t" + e.message);
    }
    process.exit(1);
  }
  return data;
}

function sortObjByKey(obj) {
  let keys = Object.keys(obj)
    .sort((str1, str2) => {
      let res = str1.split("-")[0] - str2.split("-")[0];
      if (res) {
        return res;
      }
      return str1.split("-")[1] - str2.split("-")[1];
    })
    .reverse();
  let ret = {};
  for (let key of keys) {
    ret[key] = obj[key];
  }
  return ret;
}

function add(file, courseID, s, option = "--adapt") {
  let courseIDRegExpr = /^\d{1,2}-\d{1}(?:-\d{1})?/;
  if (!courseIDRegExpr.test(courseID)) {
    showUsage();
    process.exit(1);
  }
  switch (option) {
    case "--mobile":
      option = "mobile";
      break;
    case "--teacherTrack":
      option = "teacherTrack";
      break;
    case "--pptVideo":
      option = "pptVideo";
      break;
    case "--adapt":
      option = adaptOption(file);
      break;
    default:
      showUsage();
      process.exit(1);
  }
  let obj, url;
  let courseUrlRegExpr = /^(?:http:\/\/newesxidian\.chaoxing\.com\/live\/viewNewCourseLive1\?isStudent=1&liveId=)\d+$/  // 测试是否为课程回放页面 URL
  let m3u8UrlRegExpr = /^(?:http:\/\/vodvtdu\d\.xidian\.edu\.cn:8092\/file\/cloud:\/\/10.168.76.10:6201\/HIKCLOUD\/accessid\/NUVQYWFpMEp6c0ppVVJkdFVMbDc5N3VVZjU1MWw4Szc2ODEyOGYyejdHNzkxN2FJMlhYNmQyNzQ0ZDNpTDM2\/accesskey\/a3gxcEs3SVNiN1lCeTFoOW80OThPb3o4N3I3R3hBQnpFajY3NUk3NVJ6VDdUNDdubTQ4UzQxNDUwN3RRZDJN\/bucket\/bucket\/key\/)[a-z0-9]+\/[0-9]\/\d+\/\d+\/\d(?:\/playback\.m3u8)$/  // 测试是否为 m3u8 URL
  s = s.replace(/\\/g, "");  // 去掉 s 中的反斜杠
  if (courseUrlRegExpr.test(s)) {  // 输入课程回放 URL
    const pythonProcess = spawnSync(PYTHON_PATH, [PYTHON_MAIN, "get_json", s]);
    obj = pythonProcess.stdout;
    let err = pythonProcess.stderr;
    if (err.toString() !== "") {
      console.log("==> " + "Error\n".red + "In python:\n" + err.toString());
      process.exit(1);
    }
    obj = obj.toString().trim();
    if (obj === "False") {
      console.log("==> " + "Error\n".red + "\tCouldn't get m3u8 URL. May be try again tomorrow.");
      process.exit(1);
    }
    url = parseJSON(obj, option);
  } else if (m3u8UrlRegExpr.test(s)) {  // 输入 m3u8 URL
    url = s;
  } else {  // 输入 JSON 对象
    url = parseJSON(s, option);
  }
  let data = readData(file, true);
  const split = courseID.split("-");
  const courseClass = split[0] + "-" + split[1];
  let num = parseInt(split[2]);
  if (data === null) {
    data = {};
    data[courseClass] = [];
    if (!num) {
      // 如果没有指定序号，则默认放到第一个。
      num = 1;
    }
    data[courseClass][num - 1] = url;
    data = sortObjByKey(data);
  } else {
    // 检查重复
    for (let courseID in data) {
      let res = data[courseID].findIndex((_url) => _url === url);
      if (res !== -1) {
        console.log("==> " + "Error\n".red + "\tDuplicated with " + courseID + "-" + (res + 1));
        process.exit(1);
      }
    }
    // 如果 courseClass 已经存在
    if (data.hasOwnProperty(courseClass)) {
      if (!num) {
        // 没有指定序号
        if (!data[courseClass][0]) {
          num = 1;
        } else if (!data[courseClass][1]) {
          num = 2;
        } else {
          // 已记录课程大于等于 2
          let ans = readlineSync.question(
            "==> " +
            "Warning\n\t".yellow +
            courseClass +
            "-1 and " +
            courseClass +
            "-2 already exist, where do you want to add? [<num>/show]\n\tEnter q to cancel.\n"
          );
          if (ans === "show") {
            console.log("Recorded:".green);
            show(file, courseID);
            console.log("Incoming:".red);
            console.log(url);
            ans = readlineSync.question("Where do you want to add? <num>\n\tEnter q to cancel.\n");
          }
          if (ans === "q") {
            return;
          }
          num = parseInt(ans);
          if (isNaN(num)) {
            console.log("==> " + "Error\n".red + "\tInvalid number");
            process.exit(1);
          }
        }
      }
      data[courseClass][num - 1] = url;
    } else {
      // 如果 courseClass 不存在，则创建课程类别。
      data[courseClass] = [];
      if (!num) {
        // 如果没有指定序号，则默认放到第一个。
        num = 1;
      }
      data[courseClass][num - 1] = url;
    }
    data = sortObjByKey(data);
  }

  // 写入文件
  try {
    fs.writeFileSync(file, yaml.dump(data), "utf8");
    console.log(
      "==> " + "Success\n".green + "\tSuccessfully added " +
      file.slice(0, file.indexOf(".")) +
      " " +
      courseClass +
      "-" +
      num +
      " with " +
      option +
      " mode."
    );
  } catch (e) {
    console.log("==> " + "Error\n".red + "\tFailed to write file: " + file);
    process.exit(1);
  }
}

function showUsage() {
  console.log(
    "Usage: node main.js <file> <courseWeek-week[-n]> <JSON | URL> [--mobile|--teacherTrack|--pptVideo]"
  );
  console.log("       npm start show <file> <courseWeek-week[-n]> | ls");
  console.log("       npm start rm   <file> <courseWeek-week[-n]>");
  console.log("       npm start download <file> <courseWeek-week[-n]>");
  let fileOptions = "<file>: ";
  for (let opt in course) {
    fileOptions += `${opt} = ${course[opt]}; `;
  }
  console.log(fileOptions);
}

function getCourseClass(courseID) {
  let courseClass;
  const split = courseID.split("-");
  courseClass = split[0] + "-" + split[1];
  return courseClass;
}

// 在这里编辑课程的默认视频类型
function adaptOption(file) {
  switch (file) {
    default:
      return "mobile";
  }
}

function parseJSON(s, option) {
  let obj, url;
  try {
    obj = JSON.parse(s);
    if (!obj.hasOwnProperty("videoPath")) {
      console.log("==> " + "Error\n".red + "\tVideo path not found.");
      process.exit(1);
    }
    if (obj.videoPath.hasOwnProperty(option)) {
      url = obj.videoPath[option];
    } else {
      if (Object.keys(obj.videoPath).length === 1) {
        url = obj.videoPath[Object.keys(obj.videoPath)[0]];
        console.log("==> " + "Warning\n".yellow + "\tNo video path for " + option + " found, used " + Object.keys(obj.videoPath)[0] + " instead.");
      } else {
        console.log("==> " + "Warning\n".yellow + "\tNo video path for " + option + " found.");
        console.log("\tYou can try with:\n\t");
        for (let key in obj.videoPath) {
          console.log(key + " ");
        }
        option = readlineSync.question("\tWhich one do you prefer?\n");
        if (obj.videoPath.hasOwnProperty(option)) {
          url = obj.videoPath[option];
        } else {
          console.log("==> " + "Error\n".red + "\tNo such videoPath.");
          process.exit(1);
        }
      }
    }
  } catch (e) {
    let ans = readlineSync.question("==> " + "Warning\n".yellow + "\tJSON/URL parse failed. Do you want to add the content anyway? [y/N]\n");
    if ((ans === "y") || (ans === "Y")) {
      url = s;
    } else {
      process.exit(1);
    }
  }
  return url;
}

function download(file, courseID) {
  let data = readData(`${RECORDS_DIR}/${file}`);
  if (!data) {
    console.log("==> " + "Error\n".red + "\tNo data");
    process.exit(1);
  }
  if (data === "fileNotFound") {
    console.log("==> " + "Error\n".red + "\tFile not found: " + file);
    process.exit(1);
  } else if (data === "jsonParseError") {
    console.log("==> " + "Error\n".red + "\tJSON parse error.");
    process.exit(1);
  }
  const courseClass = getCourseClass(courseID);
  if (!data.hasOwnProperty(courseClass)) {
    console.log("==> " + "Error\n".red + "\tNo data");
    process.exit(1);
  }
  console.log("==> " + "Downloading ".green + file.slice(0, file.indexOf(".")) + " " + courseID);
  if (courseClass !== courseID) {
    // 如果指定了课程序号，则只下载该序号对应的课程视频
    const num = parseInt(courseID.split("-")[2]);
    url = data[courseClass][num - 1];
    if (url) {
      spawnSync(PYTHON_PATH, [PYTHON_MAIN, "download", url, file.slice(0, file.indexOf(".")) + courseID + ".mp4"], { stdio: 'inherit' });
    } else {
      console.log("==> " + "Error\n".red + "\tNo data");
      process.exit(1);
    }
  } else {
    // 如果没有指定课程序号，则下载该课程类别下的所有课程视频
    let courseName = file.slice(0, file.indexOf("."));
    let fileArray = [];
    let fileList = "";
    let downloadDirectory = `${os.homedir()}/Downloads`;
    let outfile = `${downloadDirectory}/${courseName}${courseClass}.mp4`;
    if (fs.existsSync(outfile)) {
      console.log("==> " + "Warning\n".yellow + "\tFile exists: " + outfile);
      let ans = readlineSync.question("==> " + "Do you want to overwrite it? [y/N]\n");
      if (!((ans === "y") || (ans === "Y"))) {
        process.exit(1);
      }
    }
    for (let url of data[courseClass]) {
      if (url) {
        let index = data[courseClass].indexOf(url) + 1;
        let fileName = `${courseName}${courseClass}-${index}.mp4`;
        spawnSync(PYTHON_PATH, [PYTHON_MAIN, "download", url, fileName], { stdio: 'inherit' });
        fileArray.push(`${downloadDirectory}/${fileName}`);
        fileList += `file '${downloadDirectory}/${fileName}'\n`;
      }
    }
    // 尝试合并文件
    let allExist = fileArray.every(filePath => fs.existsSync(filePath));
    if (allExist) {
      // 创建视频列表文件
      let inputfile = `.${courseName}${courseClass}.txt`;
      fs.writeFileSync(inputfile, fileList, "utf8");
      // 使用 ffmpeg 合并视频
      console.log("==> " + "Merging videos...".green);
      let child = spawnSync("ffmpeg", ["-f", "concat", "-safe", 0, "-i", inputfile, "-c", "copy", outfile, "-y"]);
      if (child.status !== 0) {  // 判断子进程返回值
        console.log("==> " + "Error\n".red + "\t" + child.stderr.toString());  // 合并失败，报错
      } else {
        // 合并成功，删除文件
        for (let url of data[courseClass]) {
          if (url) {
            let index = data[courseClass].indexOf(url) + 1;
            let fileName = `${courseName}${courseClass}-${index}.mp4`;
            fs.unlinkSync(`${downloadDirectory}/${fileName}`);
          }
        }
      }
      fs.unlinkSync(inputfile);
      console.log("==> " + "Successfully downloaded ".green + `${courseName}${courseClass}.mp4`);
    }
  }
}
