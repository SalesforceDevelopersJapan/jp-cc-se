import {expect, test} from '@oclif/test'

describe('einstein:activity:download', () => {
  test
  .stdout()
  .command(['einstein:activity:download'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['einstein:activity:download', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
