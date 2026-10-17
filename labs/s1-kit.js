/* Statistics I — the two labs built straight on the lab kit's widgets: counting (W.countLab) and coins (W.coinLab). */
(function () {
  const { W } = Lab;
  Lab.lab({ id: 'lab-count', course: 's1', week: 5, weeks: [5, 6], order: 1, title: 'Counting lab', sub: 'Weeks 5–6 · permutations & combinations',
    topics: ['nPr', 'nCr', 'n^r', 'repeats', 'build one', 'as a probability'],
    desc: 'Type your own items. Choose r, whether order matters and whether repeats are allowed. Fill the slots, build one yourself, see every possibility and the formula with your numbers.',
    render: el => W.countLab().mount(el) });
  Lab.lab({ id: 'lab-coins', course: 's1', week: 7, weeks: [7, 9, 11], order: 1, title: 'Coin lab', sub: 'Weeks 7–11 · coins, events, PMF, CDF, binomial',
    topics: ['sample space', 'events', 'random variable', 'PMF', 'CDF', 'tree', 'simulation'],
    desc: 'Any number of tosses, any chance of heads (fair or biased). Pick your own random variable and your own event; see the sample space, the calculation, the PMF, the CDF, the tree and a live simulation.',
    render: el => W.coinLab().mount(el) });
})();
