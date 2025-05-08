import { getParifiSdkInstanceForTesting } from '..';

describe('Portfolio data fetching logic from subgraph', () => {
  it('should return portfolio data for a user address', async () => {
    const userAddress = '0x325cd6b3cd80edb102ac78848f5b127eb6db13f3';
    const priceData = [
      { id: 'c9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33', price: 95621.09246806 },
      { id: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', price: 196.77856373 },
      { id: '4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc', price: 1.86279917 },
      { id: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', price: 3356.99348105 },
      { id: '2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445', price: 297.16195995 },
      { id: '2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d', price: 0.98887032 },
      { id: '3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5', price: 0.80827732 },
      { id: '93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7', price: 38.43048232 },
      { id: '3dd2b63686a450ec7290df3a1e0b583c0481f651351edfa7636f39aed55cf8a3', price: 434.51168691 },
      { id: '2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f', price: 700.69567542 },
      { id: 'a19d04ac696c7a6616d291c7e5d1377cc8be437c327b75adb5dc1bad745fcae8', price: 0.86919072 },
      { id: 'dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c', price: 0.34841663 },
      { id: '6489800bb8974169adfe35937bf6736507097d13c190d760c557108c7e93a81b', price: 1.37554116 },
      { id: 'b962539d0fcb272a494d65ea56f94851c2bcf8823935da05bd628916e2e9edbf', price: 25.41513561 },
      { id: '8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221', price: 20.85459803 },
      { id: '6e3f3fa8253588df9326580180233eb791e03b443a3ba7a1d892e73874e19a54', price: 103.06438712 },
      { id: '9375299e31c0deb9c6bc378e6329aab44cb48ec655552a70d4b9050346a30378', price: 1445.91431957 },
      { id: 'c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750', price: 5.1749157 },
      { id: '385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf', price: 1.82605071 },
      { id: '193c739db502aadcef37c2589738b1e37bdb257d58cf1ab3c7ebc8e6df4e3ec0', price: 24.57097239 },
      { id: 'd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4', price: 0.0000182088 },
      { id: 'ffd11c5a1cfd42f80afb2df4d9f264c15f956d68153335374ec10722edd70472', price: 0.46451265 },
      { id: '0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff', price: 0.342006 },
      { id: '5fcf71143bb70d41af4fa9aa1287e2efd3c5911cee59f909f915c9f61baacb1e', price: 4.17701714 },
      { id: 'f0d57deca57b3da2fe63a493f4c25925fdfd8edf834b20f93e1f84dbd1504d4a', price: 0.000021612 },
      { id: 'ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17', price: 1.54525274 },
      { id: '09f7c1d7dfbb7df2b8fe3d3d87ee94a2259d212da4f30c1f0540d066dfa44723', price: 4.65356928 },
      { id: '78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501', price: 13.31100078 },
      { id: 'b7a8eba68a997cd0210c2e1e4ee811ad2d174b3611c22d9ebf16f4cb7e9ba850', price: 0.42586318 },
      { id: 'ec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8', price: 2.31338 },
      { id: 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', price: 0.99997412 },
      { id: '6ec879b1e9963de5ee97e9c8710b742d6228252a5e2ca12d4ae81d7fe5ee8c5d', price: 0.99899748 },
      { id: 'b0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd', price: 0.99997818 },
    ];

    const parifiSdk = await getParifiSdkInstanceForTesting();
    const response = await parifiSdk.subgraph.getPortfolioStats(userAddress, priceData);
    console.log('Response: ', response);
  });
});
