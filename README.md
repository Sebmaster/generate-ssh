generate-ssh
###

generate-ssh is a small wrapper around the ssh-keygen tool.
It supports proper error handling, doesn't call the callback multiple times (:<) and has some support for locating the ssh-keygen executable on Windows.

generate(opts { additionalPaths, comment, bits }, cb(err, data{ private, public }))
---

The generate function internally automatically tries to locate the ssh-keygen binary. It searches for the executable in `PATH` and in some commonly found places on Windows.
Alternatively, you can provide the `additionalPaths` option. It's an array with paths to search in.

You can also provide the `comment` and `bits` option, which modify how the ssh-keygen binary is called.

The generated private and public keys are provided to the callback in an object with `private` and `public` keys.

locate(searchPaths, cb(err, location))
---

locate takes an array `searchPaths` and tries to find the ssh-keygen executable in them.
If it does find them, it calls the callback with the final resolved path as the location argument. If it doesn't the callback is called with an error.
