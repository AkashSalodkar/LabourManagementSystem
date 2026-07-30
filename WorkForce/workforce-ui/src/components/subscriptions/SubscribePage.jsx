import React, { useState } from 'react';

const SubscribePage = ({ onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const plans = [
    {
      key: 'free',
      name: 'Free',
      price: 0,
      tagline: 'Try it out',
      features: ['1 active project', 'Up to 5 workers', 'Manual attendance marking', 'Basic payment tracking'],
    },
    {
      key: 'pro',
      name: 'Pro',
      price: 299,
      tagline: 'For growing supervisors',
      popular: true,
      features: ['Unlimited projects', 'Unlimited workers', 'Wage history & wage edits', 'Payment tracking + PDF statements', 'Priority email support'],
    },
    {
      key: 'business',
      name: 'Business',
      price: 799,
      tagline: 'For multi-site teams',
      features: ['Everything in Pro', 'Multiple supervisor logins', 'Data export (CSV/Excel)', 'Dedicated priority support', 'Early access to new features'],
    },
  ];

  const handleSelectPlan = (planKey) => {
    setSelectedPlan(planKey);
    const plan = plans.find(p => p.key === planKey);
    alert(plan.price === 0
      ? "You're on the Free plan."
      : `This is a preview — payment isn't wired up yet, but you've selected the ${plan.name} plan (₹${plan.price}/month).`
    );
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: 'calc(100vh - 64px)',
      backgroundColor: '#f4f6f9',
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        padding: '18px 16px 14px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#1E293B', cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Subscribe now</h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
            Pick a plan that fits how many projects and workers you manage
          </p>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {plans.map(plan => {
            const isSelected = selectedPlan === plan.key;
            return (
              <div key={plan.key} style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '18px',
                border: isSelected ? '2px solid #0B3C9B' : '1px solid #F1F5F9',
                boxShadow: plan.popular ? '0 4px 16px rgba(11,60,155,0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                position: 'relative',
              }}>
                {plan.popular && (
                  <span style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '18px',
                    backgroundColor: '#0B3C9B',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '20px',
                  }}>
                    MOST POPULAR
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1E293B' }}>{plan.name}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>{plan.tagline}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0B3C9B' }}>
                      {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                    </p>
                    {plan.price > 0 && <span style={{ fontSize: '11px', color: '#94A3B8' }}>per month</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#10B981', fontSize: '13px', marginTop: '1px' }}>✓</span>
                      <span style={{ fontSize: '13px', color: '#475569' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.key)}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    border: isSelected ? 'none' : '1px solid #0B3C9B',
                    backgroundColor: isSelected ? '#0B3C9B' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#0B3C9B',
                  }}
                >
                  {isSelected ? 'Current plan' : plan.price === 0 ? 'Use Free plan' : `Choose ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', margin: '16px 0 4px 0' }}>
          Prices shown are illustrative. You can change or cancel your plan anytime.
        </p>
      </div>
    </div>
  );
};

export default SubscribePage;