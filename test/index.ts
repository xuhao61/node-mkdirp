import { mkdir, mkdirSync, statSync } from 'fs'
import t from 'tap'
import mkdirp from '../dist/cjs/src/index.js'
import {
  MkdirpOptions,
  MkdirpOptionsResolved,
} from '../dist/cjs/src/opts-arg.js'

// node before 10.13 didn't native recursive mkdir
const doNative = !/^v([0-8]\.|10.([0-9]\.|10\.|11\.([0-9]|1[01])$))/.test(
  process.version
)

t.test('module shape', t => {
  t.type(mkdirp, Function)
  t.type(mkdirp.sync, Function)
  t.type(mkdirp.manual, Function)
  t.type(mkdirp.manualSync, Function)
  if (doNative) {
    t.type(mkdirp.native, Function)
    t.type(mkdirp.nativeSync, Function)
  }
  t.end()
})

t.test('basic making of dirs should work', async t => {
  const dir = t.testdir({ a: {} })
  const check = (d: string) => t.ok(statSync(d).isDirectory())
  t.equal(mkdirp.sync(`${dir}/a/sync`), `${dir}/a/sync`)
  check(`${dir}/a/sync`)
  t.equal(mkdirp.sync(`${dir}/a/sync`), undefined)

  t.equal(mkdirp.manualSync(`${dir}/a/manual-sync`), `${dir}/a/manual-sync`)
  check(`${dir}/a/manual-sync`)
  t.equal(mkdirp.manualSync(`${dir}/a/manual-sync`), undefined)

  if (doNative) {
    t.equal(mkdirp.nativeSync(`${dir}/a/native-sync`), `${dir}/a/native-sync`)
    check(`${dir}/a/native-sync`)
    t.equal(mkdirp.nativeSync(`${dir}/a/native-sync`), undefined)
  }

  // override to force the manual option
  const myMkdir = (
    path: string,
    opts: MkdirpOptionsResolved,
    cb: (er: NodeJS.ErrnoException, made: string | undefined | void) => void
    //@ts-ignore
  ) => mkdir(path, opts, cb)
  const myMkdirSync = (path: string, opts: MkdirpOptions) =>
    mkdirSync(path, opts)
  const opts = { mkdir: myMkdir, mkdirSync: myMkdirSync }
  //@ts-ignore
  t.equal(mkdirp.sync(`${dir}/a/custom-sync`, opts), `${dir}/a/custom-sync`)
  check(`${dir}/a/custom-sync`)
  //@ts-ignore
  t.equal(mkdirp.sync(`${dir}/a/custom-sync`, opts), undefined)

  return Promise.all([
    mkdirp(`${dir}/a/async`),
    mkdirp.manual(`${dir}/a/manual-async`),
    doNative && mkdirp.native(`${dir}/a/native-async`),
    //@ts-ignore
    mkdirp(`${dir}/a/custom-async`, opts),
  ])
    .then(made => {
      t.strictSame(made, [
        `${dir}/a/async`,
        `${dir}/a/manual-async`,
        doNative && `${dir}/a/native-async`,
        `${dir}/a/custom-async`,
      ])
      check(`${dir}/a/async`)
      check(`${dir}/a/manual-async`)
      doNative && check(`${dir}/a/native-async`)
      check(`${dir}/a/custom-async`)
      return Promise.all([
        mkdirp(`${dir}/a/async`),
        mkdirp.manual(`${dir}/a/manual-async`),
        doNative ? mkdirp.native(`${dir}/a/native-async`) : undefined,
        //@ts-ignore
        mkdirp(`${dir}/a/custom-async`, opts),
      ])
    })
    .then(made =>
      t.strictSame(made, [undefined, undefined, undefined, undefined])
    )
})
