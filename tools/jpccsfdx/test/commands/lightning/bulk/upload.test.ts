import {expect, test} from '@oclif/test'

describe('lightning:bulk:upload', () => {
  test
  .stdout()
  .command(['lightning:bulk:upload'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['lightning:bulk:upload', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
