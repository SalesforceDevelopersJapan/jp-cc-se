import {expect, test} from '@oclif/test'

describe('account:bulk:upload', () => {
  test
  .stdout()
  .command(['account:bulk:upload'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['account:bulk:upload', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
