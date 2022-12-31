import prompts from 'prompts';
import * as dotenv from 'dotenv'
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { promisify } from 'util';
import _ from 'lodash';
import ProgressBar from 'progress';

dotenv.config();

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);


(async () => {
  console.log(`1. Open your Plex server web app, as normal.\n2.In Plex, navigate to any file in the library for which you want to import a playlist.(e.g. in your 'Rock Music' library, navigate to 'BornToBeWild.mp3').\n3. On the play bar for that library item, click the More Actions ellipses (...), select Get Info, and then click View XML.\nA new browser window opens containing XML details about the library item. From the URL, copy the X-Plex-Token value into a text editor. From the page content, copy the librarySectionID value into a text editor.\n4. Locate the path to the folder full of m3u files that you want to import (e.g. C:\MyMusic\MyCoolRock.m3u)`);
 const response = await prompts([{
    type: 'text',
    name: 'folder',
    message: 'What is the folder of m3u files that you wish to import?',
  }]);
  const folder: string | undefined = response.folder;
  if (!folder || !fs.existsSync(folder)) {
    console.error('Folder is required and should be a path to a directory of files.');
    return 1;
  }

  const allFiles = await readDir(folder);
  const files: string[] = [];
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    if (_.endsWith(file, '.m3u')) {
      files.push(path.resolve(folder, file));
    }
  }
  if (!files.length) {
    console.error(`${response.folder} seems to contain 0 m3u files. Are you sure you got the path right?`);
    return 1;
  }
  const r = await prompts({
    type: 'confirm',
    name: 'approve',
    message: `Found ${files.length} m3u files to import. Are you sure you want to import them now to?`,
    initial: true,
  });
  if (!r.approve) {
    return 1;
  }

  const bar = new ProgressBar(
    'Import progres :bar in :counter',
    { total: files.length, width: 50 },
  )
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uri = `${process.env.PLEX_SERVER}?sectionID=${process.env.PLEX_LIBRARY_SECTION}&path=${encodeURIComponent(file)}&X-Plex-Token=${process.env.PLEX_TOKEN}`;
    const r = await fetch(
      uri,
      {
        method: 'POST',
      }
    );
    console.log(file);
    console.log(uri);
    console.log(r);
    bar.tick({ counter: i })
  }
})();
