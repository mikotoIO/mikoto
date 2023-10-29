# Mikoto Media Server

## Configurations

configuration is a JSON file of bucket name / store config pairs.

```js
  avatar: {
    restrictions: [{ id: 'IS_FILETYPE', type: 'image' }],
    transformations: [{ id: 'RESIZE', width: 512, height: 512 }],
  },
  spaceicon: {
    restrictions: [{ id: 'IS_FILETYPE', type: 'image' }],
    transformations: [{ id: 'RESIZE', width: 512, height: 512 }],
  },
```
