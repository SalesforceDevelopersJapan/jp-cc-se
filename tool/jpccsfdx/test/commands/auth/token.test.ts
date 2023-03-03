import {expect, test} from '@oclif/test'

describe('auth:token', () => {
  test
  .stdout()
  .command(['auth:token'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['auth:token', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
