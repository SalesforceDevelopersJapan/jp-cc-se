import {expect, test} from '@oclif/test'

describe('cms:upload', () => {
  test
  .stdout()
  .command(['cms:upload'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['cms:upload', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
