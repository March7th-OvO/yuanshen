const ORDER = ['userA', 'userB'];

export default function UserSwitch({ active, users, onChange }) {
  return (
    <div className="switch" role="tablist" aria-label="切换用户">
      <span className="switch-thumb" data-pos={active} aria-hidden="true" />
      {ORDER.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          className={active === key ? 'active' : ''}
          onClick={() => onChange(key)}
        >
          {users[key].name}
        </button>
      ))}
    </div>
  );
}
